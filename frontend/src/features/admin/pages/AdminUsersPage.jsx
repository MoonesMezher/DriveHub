import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, Pagination, SkeletonTable,
  Alert, FormSection, SearchInput, StatusBadge,
} from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { useToast } from '@/hooks/useToast'
import { ROLE_LABELS } from '@/lib/constants/roles'
import { UserDetailPanel } from '../components/UserDetailPanel'

const PAGE_SIZE = 10

const userStatusLabels = {
  active: 'نشط',
  suspended: 'موقوف',
}

const userStatusVariants = {
  active: 'success',
  suspended: 'error',
}

const extractUsers = (payload) => {
  const node = payload?.users
  return Array.isArray(node) ? node : node?.users ?? []
}

const emptyTrafficForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
}

const emptyWalletForm = {
  amount: '',
  note: '',
}

export const AdminUsersPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showTrafficForm, setShowTrafficForm] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [showWalletForm, setShowWalletForm] = useState(false)
  const [walletForm, setWalletForm] = useState(emptyWalletForm)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [trafficForm, setTrafficForm] = useState(emptyTrafficForm)
  const [createdCredentials, setCreatedCredentials] = useState(null)

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.listUsers().then(unwrap),
  })

  const users = extractUsers(usersQuery.data)

  const userDetailQuery = useQuery({
    queryKey: ['admin', 'users', selectedUserId],
    queryFn: () => adminService.getUser(selectedUserId).then(unwrap),
    enabled: Boolean(selectedUserId),
  })

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q)
        || u.email?.toLowerCase().includes(q)
        || u.phone?.includes(q),
    )
  }, [users, search])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const paginatedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selectedFromList = useMemo(
    () => users.find((u) => u._id === selectedUserId) || null,
    [users, selectedUserId],
  )

  const selectedUser = userDetailQuery.data?.user || selectedFromList

  const suspendMutation = useMutation({
    mutationFn: ({ id, status }) =>
      adminService.suspendUser(id, { status, reason: status === 'suspended' ? 'إيقاف إداري' : undefined }).then(unwrap),
    onSuccess: () => {
      toast.success('تم تحديث حالة المستخدم')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (err) => toast.error(err, 'فشل تحديث المستخدم'),
  })

  const walletQuery = useQuery({
    queryKey: ['admin', 'wallet', selectedUserId],
    queryFn: () => adminService.getUserWallet(selectedUserId).then(unwrap),
    enabled: Boolean(selectedUserId && showWalletForm),
  })

  const creditWalletMutation = useMutation({
    mutationFn: ({ userId, amount, note }) =>
      adminService.creditUserWallet(userId, { amount: Number(amount), note: note.trim() || undefined }).then(unwrap),
    onSuccess: () => {
      toast.success('تم شحن الرصيد')
      setWalletForm(emptyWalletForm)
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet', selectedUserId] })
    },
    onError: (err) => toast.error(err, 'فشل شحن الرصيد'),
  })

  const createTrafficMutation = useMutation({
    mutationFn: (data) => adminService.createTrafficAccount(data).then(unwrap),
    onSuccess: (data, variables) => {
      toast.success('تم إنشاء حساب المرور')
      setCreatedCredentials({ email: variables.email, password: variables.password })
      setTrafficForm(emptyTrafficForm)
      setShowTrafficForm(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (err) => toast.error(err, 'فشل إنشاء الحساب'),
  })

  const handleCreateTraffic = (e) => {
    e.preventDefault()
    createTrafficMutation.mutate({
      name: trafficForm.name.trim(),
      email: trafficForm.email.trim(),
      phone: trafficForm.phone.trim(),
      password: trafficForm.password,
    })
  }

  const handleCreditWallet = (e) => {
    e.preventDefault()
    if (!selectedUserId) return
    creditWalletMutation.mutate({
      userId: selectedUserId,
      amount: walletForm.amount,
      note: walletForm.note,
    })
  }

  const toggleUser = (user) => {
    setSelectedUserId((prev) => {
      if (prev === user._id) {
        setShowWalletForm(false)
        setWalletForm(emptyWalletForm)
        return null
      }
      setShowWalletForm(false)
      setWalletForm(emptyWalletForm)
      return user._id
    })
  }

  const columns = [
    {
      key: 'name',
      label: 'الاسم',
      className: 'max-w-[140px]',
      render: (user) => (
        <span className="block truncate font-medium" title={user.name || ''}>
          {user.name}
        </span>
      ),
    },
    {
      key: 'email',
      label: 'البريد',
      className: 'max-w-[200px]',
      render: (user) => (
        <span className="block truncate" title={user.email || ''}>
          {user.email}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'الهاتف',
      className: 'whitespace-nowrap',
      render: (user) => user.phone || '—',
    },
    {
      key: 'walletBalance',
      label: 'الرصيد',
      className: 'whitespace-nowrap',
      render: (user) => `${user.walletBalance ?? 0} د.أ`,
    },
    {
      key: 'roles',
      label: 'الأدوار',
      className: 'max-w-[180px]',
      render: (user) => {
        const parts = (user.roles || []).map((r) => {
          const roleLabel = ROLE_LABELS[r.role] || r.role
          const schoolName = r.schoolName
            || (typeof r.schoolId === 'object' ? r.schoolId?.name : null)
          return schoolName ? `${roleLabel} (${schoolName})` : roleLabel
        })
        const rolesText = parts.join('، ') || '—'
        return (
          <span className="block truncate" title={rolesText}>
            {rolesText}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'الحالة',
      className: 'whitespace-nowrap',
      render: (user) => (
        <StatusBadge
          status={user.status}
          labels={userStatusLabels}
          variants={userStatusVariants}
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'تاريخ التسجيل',
      className: 'whitespace-nowrap',
      render: (user) => formatDate(user.createdAt),
    },
  ]

  return (
    <div className="min-w-0 max-w-full" dir="rtl">
      <PageHeader
        variant="compact"
        title="المستخدمون"
        description="عرض المستخدمين، إنشاء حسابات إدارة المرور، وإيقاف أو تفعيل الحسابات"
        actions={
          <Button variant="ultra" onClick={() => setShowTrafficForm((v) => !v)}>
            {showTrafficForm ? 'إلغاء' : 'حساب مرور جديد'}
          </Button>
        }
      />

      {createdCredentials && (
        <Alert
          variant="success"
          title="تم إنشاء حساب المرور"
          onDismiss={() => setCreatedCredentials(null)}
          className="mb-loose min-w-0"
        >
          سلّم بيانات الدخول لموظف وزارة النقل:{' '}
          <span className="break-all font-mono">
            {createdCredentials.email} / {createdCredentials.password}
          </span>
        </Alert>
      )}

      {showTrafficForm && (
        <Card title="إنشاء حساب إدارة المرور / وزارة النقل" className="mb-loose min-w-0 max-w-full">
          <FormSection description="يمنح هذا الحساب صلاحية مراقبة سير العمل، نشر قوائم الناجحين، والوصول لبيانات الطلاب.">
            <form onSubmit={handleCreateTraffic} className="grid gap-4 sm:grid-cols-2">
              <Input label="الاسم" value={trafficForm.name} onChange={(e) => setTrafficForm((f) => ({ ...f, name: e.target.value }))} required />
              <Input label="البريد" type="email" value={trafficForm.email} onChange={(e) => setTrafficForm((f) => ({ ...f, email: e.target.value }))} required />
              <Input label="الهاتف" value={trafficForm.phone} onChange={(e) => setTrafficForm((f) => ({ ...f, phone: e.target.value }))} required />
              <Input label="كلمة المرور" type="password" value={trafficForm.password} onChange={(e) => setTrafficForm((f) => ({ ...f, password: e.target.value }))} required hint="8 أحرف على الأقل" />
              <div className="sm:col-span-2">
                <Button type="submit" variant="ultra" disabled={createTrafficMutation.isPending}>إنشاء الحساب</Button>
              </div>
            </form>
          </FormSection>
        </Card>
      )}

      <div className="mb-comfortable min-w-0">
        <SearchInput
          placeholder="بحث بالاسم أو البريد..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <Card padding="none" className="min-w-0 max-w-full overflow-hidden">
        {usersQuery.isLoading ? (
          <div className="p-comfortable"><SkeletonTable rows={6} cols={7} /></div>
        ) : usersQuery.error ? (
          <div className="p-comfortable">
            <Alert variant="error" title="حدث خطأ">{getErrorMessage(usersQuery.error)}</Alert>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={paginatedUsers}
              emptyLabel="لا يوجد مستخدمون"
              className="max-w-full"
              onRowClick={toggleUser}
              rowClassName={(row) => (
                selectedUserId === row._id
                  ? 'bg-primary-container/30 hover:bg-primary-container/40'
                  : undefined
              )}
            />
            <div className="border-t border-outline-variant/50 p-comfortable">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
            {selectedUserId && userDetailQuery.isError && !selectedFromList && (
              <div className="p-comfortable">
                <Alert variant="error" title="تعذر تحميل التفاصيل">
                  {getErrorMessage(userDetailQuery.error)}
                </Alert>
              </div>
            )}
            {selectedUser && (
              <UserDetailPanel
                user={selectedUser}
                onClose={() => {
                  setSelectedUserId(null)
                  setShowWalletForm(false)
                  setWalletForm(emptyWalletForm)
                }}
                statusPending={suspendMutation.isPending}
                onToggleStatus={(user) => {
                  suspendMutation.mutate({
                    id: user._id,
                    status: user.status === 'active' ? 'suspended' : 'active',
                  })
                }}
                showWalletForm={showWalletForm}
                onToggleWalletForm={() => setShowWalletForm((v) => !v)}
                walletForm={walletForm}
                onWalletFormChange={(patch) => setWalletForm((f) => ({ ...f, ...patch }))}
                onCreditWallet={handleCreditWallet}
                walletCreditPending={creditWalletMutation.isPending}
                walletBalance={walletQuery.data?.balance ?? selectedUser.walletBalance}
                walletTransactions={walletQuery.data?.transactions || []}
              />
            )}
          </>
        )}
      </Card>
    </div>
  )
}
