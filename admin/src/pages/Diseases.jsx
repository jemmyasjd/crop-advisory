import * as Yup from 'yup';
import CrudPage from '../components/CrudPage';
import FormField from '../components/FormField';
import useOptions from '../hooks/useOptions';
import { diseasesApi } from '../api/services';

const schema = Yup.object({
  cropId: Yup.number().typeError('Select a crop').required('Crop is required'),
  diseaseName: Yup.string().trim().required('Disease name is required'),
  description: Yup.string().trim().nullable(),
});

export default function Diseases() {
  const { crops } = useOptions({ crops: true });
  const cropName = (id) => crops.find((c) => c.id === id)?.name || `#${id}`;

  return (
    <CrudPage
      title="Diseases"
      singular="Disease"
      api={diseasesApi}
      searchKeys={['disease_name']}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'crop_id', label: 'Crop', render: (r) => cropName(r.crop_id) },
        { key: 'disease_name', label: 'Disease' },
        {
          key: 'description',
          label: 'Description',
          render: (r) =>
            r.description
              ? r.description.length > 60
                ? r.description.slice(0, 60) + '…'
                : r.description
              : '—',
        },
      ]}
      rowName={(r) => r.disease_name}
      toInitialValues={(r) => ({
        cropId: r.crop_id ?? (crops[0]?.id || ''),
        diseaseName: r.disease_name || '',
        description: r.description || '',
      })}
      validationSchema={schema}
      toPayload={(v) => ({
        cropId: Number(v.cropId),
        diseaseName: v.diseaseName,
        description: v.description || null,
      })}
      fields={() => (
        <>
          <FormField
            label="Crop"
            name="cropId"
            as="select"
            options={crops.map((c) => ({ value: c.id, label: c.name }))}
          />
          <FormField label="Disease Name" name="diseaseName" placeholder="Fusarium Wilt" />
          <FormField label="Description" name="description" as="textarea" />
        </>
      )}
    />
  );
}
