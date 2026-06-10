import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader, Card, Button, AsyncContent, StatusBadge } from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'
import { useToast } from '@/hooks/useToast'

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

export const AdminUsersPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.listUsers().then(unwrap),
  })

  const users = extractUsers(usersQuery.data)

  const suspendMutation = useMutation({
    mutationFn: ({ id, status }) =>
      adminService.suspendUser(id, { status, reason: status === 'suspended' ? 'إيقاف إداري' : undefined }).then(unwrap),
    onSuccess: () => {
      toast.success('تم تحديث حالة المستخدم')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (err) => toast.error(err, 'فشل تحديث المستخدم'),
  })

  return (
    <div>
      <PageHeader title="المستخدمون" description="عرض المستخدمين وإيقاف أو تفعيل الحسابات" />

      <Card>
        <AsyncContent
          isLoading={usersQuery.isLoading}
          error={usersQuery.error}
          isEmpty={users.length === 0}
          emptyTitle="لا يوجد مستخدمون"
        >
          {() => (
<div className="overflow-x-auto">
            <table className="w-full text-body-md">
              <thead>
                <tr className="border-b border-outline-variant text-label-md text-on-surface-variant">
                  <th className="py-3 pe-4 text-start">الاسم</th>
                  <th className="py-3 pe-4 text-start">البريد</th>
                  <th className="py-3 pe-4 text-start">الهاتف</th>
                  <th className="py-3 pe-4 text-start">الأدوار</th>
                  <th className="py-3 pe-4 text-start">الحالة</th>
                  <th className="py-3 pe-4 text-start">تاريخ التسجيل</th>
                  <th className="py-3 pe-4 text-start">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-outline-variant/50 last:border-0">
                    <td className="py-3 pe-4 font-medium">{user.name}</td>
                    <td className="py-3 pe-4">{user.email}</td>
                    <td className="py-3 pe-4">{user.phone || '—'}</td>
                    <td className="py-3 pe-4">
                      {(user.roles || []).map((r) => r.role).join(', ') || '—'}
                    </td>
                    <td className="py-3 pe-4">
                      <StatusBadge
                        status={user.status}
                        labels={userStatusLabels}
                        variants={userStatusVariants}
                      />
                    </td>
                    <td className="py-3 pe-4">{formatDate(user.createdAt)}</td>
                    <td className="py-3 pe-4">
                      {user.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            suspendMutation.mutate({ id: user._id, status: 'suspended' })
                          }
                          disabled={suspendMutation.isPending}
                        >
                          إيقاف
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            suspendMutation.mutate({ id: user._id, status: 'active' })
                          }
                          disabled={suspendMutation.isPending}
                        >
                          تفعيل
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          )}
        </AsyncContent>
      </Card>
    </div>
  )
}
