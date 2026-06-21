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

export const AdminUsersPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showTrafficForm, setShowTrafficForm] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [trafficForm, setTrafficForm] = useState(emptyTrafficForm)
  const [createdCredentials, setCreatedCredentials] = useState(null)

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.listUsers().then(unwrap),
  })

  const users = extractUsers(usersQuery.data)

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

  const suspendMutation = useMutation({
    mutationFn: ({ id, status }) =>
      adminService.suspendUser(id, { status, reason: status === 'suspended' ? 'إيقاف إداري' : undefined }).then(unwrap),
    onSuccess: () => {
      toast.success('تم تحديث حالة المستخدم')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (err) => toast.error(err, 'فشل تحديث المستخدم'),
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

  const columns = [
    {
      key: 'name',
      label: 'الاسم',
      render: (user) => <span className="font-medium">{user.name}</span>,
    },
    { key: 'email', label: 'البريد' },
    { key: 'phone', label: 'الهاتف', render: (user) => user.phone || '—' },
    {
      key: 'roles',
      label: 'الأدوار',
      render: (user) => (user.roles || []).map((r) => r.role).join(', ') || '—',
    },
    {
      key: 'status',
      label: 'الحالة',
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
      render: (user) => formatDate(user.createdAt),
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (user) =>
        user.status === 'active' ? (
          <Button
            size="sm"
            variant="danger"
            onClick={() => suspendMutation.mutate({ id: user._id, status: 'suspended' })}
            disabled={suspendMutation.isPending}
          >
            إيقاف
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => suspendMutation.mutate({ id: user._id, status: 'active' })}
            disabled={suspendMutation.isPending}
          >
            تفعيل
          </Button>
        ),
    },
  ]

  return (
    <div>
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
          className="mb-loose"
        >
          سلّم بيانات الدخول لموظف وزارة النقل:{' '}
          <span className="font-mono">{createdCredentials.email} / {createdCredentials.password}</span>
        </Alert>
      )}

      {showTrafficForm && (
        <Card title="إنشاء حساب إدارة المرور / وزارة النقل" className="mb-loose">
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

      <div className="mb-comfortable">
        <SearchInput
          placeholder="بحث بالاسم أو البريد..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <Card padding="none">
        {usersQuery.isLoading ? (
          <div className="p-comfortable"><SkeletonTable rows={6} cols={7} /></div>
        ) : usersQuery.error ? (
          <div className="p-comfortable">
            <Alert variant="error" title="حدث خطأ">{getErrorMessage(usersQuery.error)}</Alert>
          </div>
        ) : (
          <>
            <DataTable columns={columns} rows={paginatedUsers} emptyLabel="لا يوجد مستخدمون" />
            <div className="border-t border-outline-variant/50 p-comfortable">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
