import { useQuery } from '@tanstack/react-query'
import { Select } from './Select'
import { licenseService } from '@/lib/services'
import { unwrapList } from '@/lib/helpers/api'

export const LicenseCategorySelect = ({
  label = 'رمز الفئة',
  value = '',
  onChange,
  name = 'categoryCode',
  required = false,
  error,
  hint,
  placeholder = '— اختر فئة —',
  wrapperClassName = '',
  ...props
}) => {
  const { data: licenses = [], isLoading } = useQuery({
    queryKey: ['licenses'],
    queryFn: async () => unwrapList(await licenseService.list(), ['licenses']),
    staleTime: 5 * 60 * 1000,
  })

  const options = licenses.map((license) => ({
    value: license.code,
    label: `${license.code} — ${license.name}`,
  }))

  return (
    <Select
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      error={error}
      hint={isLoading ? 'جاري تحميل الفئات...' : hint}
      placeholder={placeholder}
      options={options}
      disabled={isLoading || props.disabled}
      wrapperClassName={wrapperClassName}
      {...props}
    />
  )
}
