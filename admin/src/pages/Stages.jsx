import * as Yup from 'yup';
import CrudPage from '../components/CrudPage';
import FormField from '../components/FormField';
import useOptions from '../hooks/useOptions';
import { stagesApi } from '../api/services';

const schema = Yup.object({
  cropId: Yup.number().typeError('Select a crop').required('Crop is required'),
  stageName: Yup.string().trim().required('Stage name is required'),
  gddStart: Yup.number().typeError('Must be a number').min(0).required('GDD start is required'),
  gddEnd: Yup.number()
    .typeError('Must be a number')
    .min(0)
    .required('GDD end is required')
    .test('gte', 'GDD end must be ≥ GDD start', function (v) {
      return v == null || this.parent.gddStart == null || v >= this.parent.gddStart;
    }),
  sortOrder: Yup.number().typeError('Must be a number').min(0),
});

export default function Stages() {
  const { crops } = useOptions({ crops: true });
  const cropName = (id) => crops.find((c) => c.id === id)?.name || `#${id}`;

  return (
    <CrudPage
      title="Crop Stages"
      singular="Stage"
      api={stagesApi}
      searchKeys={['stage_name']}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'crop_id', label: 'Crop', render: (r) => cropName(r.crop_id) },
        { key: 'stage_name', label: 'Stage' },
        { key: 'gdd_start', label: 'GDD Start' },
        { key: 'gdd_end', label: 'GDD End' },
        { key: 'sort_order', label: 'Order' },
      ]}
      rowName={(r) => r.stage_name}
      toInitialValues={(r) => ({
        cropId: r.crop_id ?? (crops[0]?.id || ''),
        stageName: r.stage_name || '',
        gddStart: r.gdd_start ?? '',
        gddEnd: r.gdd_end ?? '',
        sortOrder: r.sort_order ?? 0,
      })}
      validationSchema={schema}
      toPayload={(v) => ({
        cropId: Number(v.cropId),
        stageName: v.stageName,
        gddStart: Number(v.gddStart),
        gddEnd: Number(v.gddEnd),
        sortOrder: Number(v.sortOrder) || 0,
      })}
      fields={() => (
        <>
          {/* cropId only applies on create; the update endpoint ignores it. */}
          <FormField
            label="Crop"
            name="cropId"
            as="select"
            options={crops.map((c) => ({ value: c.id, label: c.name }))}
          />
          <FormField label="Stage Name" name="stageName" placeholder="Vegetative & Vining" />
          <div className="form-row">
            <FormField label="GDD Start" name="gddStart" type="number" />
            <FormField label="GDD End" name="gddEnd" type="number" />
          </div>
          <FormField label="Sort Order" name="sortOrder" type="number" />
        </>
      )}
    />
  );
}
