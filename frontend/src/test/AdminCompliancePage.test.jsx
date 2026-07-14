import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminCompliancePage } from '@/features/admin/pages/AdminCompliancePage'

const complianceListResponse = {
  requests: [
    {
      id: 'req-1',
      type: 'school_onboarding',
      status: 'pending',
      schoolName: 'مدرسة المستقبل',
      city: 'دمشق',
      ownerName: 'مالك تجريبي',
      createdAt: '2026-07-01T10:00:00.000Z',
    },
  ],
}

const complianceDetailResponse = {
  request: {
    id: 'req-1',
    type: 'school_onboarding',
    status: 'pending',
    school: { name: 'مدرسة المستقبل', categories: ['B'] },
    owner: { name: 'مالك تجريبي', nationalId: '123456789' },
    bank: { iban: 'SY001234' },
    documents: [],
  },
}

const { mockAdminService } = vi.hoisted(() => ({
  mockAdminService: {
    listComplianceRequests: vi.fn(() => Promise.resolve({ data: complianceListResponse })),
    getComplianceRequest: vi.fn(() => Promise.resolve({ data: complianceDetailResponse })),
    approveComplianceRequest: vi.fn(() => Promise.resolve({ data: { success: true } })),
    rejectComplianceRequest: vi.fn(() => Promise.resolve({ data: { success: true } })),
  },
}))

vi.mock('@/lib/services', () => ({
  adminService: mockAdminService,
  licenseService: { listCategories: vi.fn(() => Promise.resolve({ data: [] })) },
}))
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }))
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminCompliancePage />
    </QueryClientProvider>,
  )
}

describe('AdminCompliancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads compliance requests list', async () => {
    renderPage()
    await waitFor(() => expect(screen.getAllByText('مدرسة المستقبل').length).toBeGreaterThan(0))
  })

  it('opens details and approves pending request', async () => {
    renderPage()
    await waitFor(() => expect(screen.getAllByText('مدرسة المستقبل').length).toBeGreaterThan(0))

    fireEvent.click(screen.getAllByText('عرض التفاصيل')[0])
    await waitFor(() => expect(screen.getByText('تفاصيل طلب الامتثال')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('قبول الطلب')).toBeInTheDocument())

    fireEvent.click(screen.getByText('قبول الطلب'))
    await waitFor(() => expect(mockAdminService.approveComplianceRequest).toHaveBeenCalledWith('req-1'))
  })
})
