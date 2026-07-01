import * as Yup from 'yup';
import CrudPage from '../components/CrudPage';
import FormField from '../components/FormField';
import { cropsApi } from '../api/services';

const schema = Yup.object({
  name: Yup.string().trim().required('Name is required'),
  baseTemperature: Yup.number().typeError('Must be a number').required('Base temperature is required'),
});

export default function Crops() {
  return (
    <CrudPage
      title="Crops"
      singular="Crop"
      api={cropsApi}
      searchKeys={['name']}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        {
          key: 'base_temperature',
          label: 'Base Temp (°C)',
          render: (r) => `${Number(r.base_temperature)} °C`,
        },
        {
          key: 'created_at',
          label: 'Created',
          render: (r) => new Date(r.created_at).toLocaleDateString(),
        },
      ]}
      rowName={(r) => r.name}
      toInitialValues={(r) => ({
        name: r.name || '',
        baseTemperature: r.base_temperature ?? '',
      })}
      validationSchema={schema}
      toPayload={(v) => ({ name: v.name, baseTemperature: Number(v.baseTemperature) })}
      fields={() => (
        <>
          <FormField label="Crop Name" name="name" placeholder="Watermelon" />
          <FormField label="Base Temperature (°C)" name="baseTemperature" type="number" step="0.1" />
        </>
      )}
    />
  );
}
