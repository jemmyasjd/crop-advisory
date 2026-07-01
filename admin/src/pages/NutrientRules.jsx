import * as Yup from 'yup';
import CrudPage from '../components/CrudPage';
import FormField from '../components/FormField';
import useOptions from '../hooks/useOptions';
import { nutrientRulesApi } from '../api/services';

const schema = Yup.object({
  cropId: Yup.number().typeError('Select a crop').required('Crop is required'),
  stageId: Yup.number().typeError('Select a stage').required('Stage is required'),
  season: Yup.string().trim().nullable(),
  nutrient: Yup.string().trim().required('Nutrient is required'),
  fertilizer: Yup.string().trim().required('Fertilizer is required'),
  soilThreshold: Yup.number().typeError('Must be a number').required('Threshold is required'),
  doseUnderThreshold: Yup.number().typeError('Must be a number').required('Required'),
  doseAboveThreshold: Yup.number().typeError('Must be a number').required('Required'),
});

export default function NutrientRules() {
  const { crops, stages } = useOptions({ crops: true, stages: true });
  const cropName = (id) => crops.find((c) => c.id === id)?.name || `#${id}`;
  const stageName = (id) => stages.find((s) => s.id === id)?.stage_name || `#${id}`;

  return (
    <CrudPage
      title="Nutrient Rules"
      singular="Nutrient Rule"
      api={nutrientRulesApi}
      searchKeys={['nutrient', 'fertilizer']}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'crop_id', label: 'Crop', render: (r) => cropName(r.crop_id) },
        { key: 'stage_id', label: 'Stage', render: (r) => stageName(r.stage_id) },
        { key: 'nutrient', label: 'Nutrient' },
        { key: 'fertilizer', label: 'Fertilizer' },
        { key: 'soil_threshold', label: 'Threshold', render: (r) => Number(r.soil_threshold) },
        {
          key: 'doses',
          label: 'Dose (under / above)',
          render: (r) => `${Number(r.dose_under_threshold)} / ${Number(r.dose_above_threshold)} kg/ha`,
        },
      ]}
      rowName={(r) => `${r.nutrient} (${r.fertilizer})`}
      toInitialValues={(r) => ({
        cropId: r.crop_id ?? (crops[0]?.id || ''),
        stageId: r.stage_id ?? (stages[0]?.id || ''),
        season: r.season || 'Rabi',
        nutrient: r.nutrient || '',
        fertilizer: r.fertilizer || '',
        soilThreshold: r.soil_threshold ?? '',
        doseUnderThreshold: r.dose_under_threshold ?? '',
        doseAboveThreshold: r.dose_above_threshold ?? '',
      })}
      validationSchema={schema}
      toPayload={(v) => ({
        cropId: Number(v.cropId),
        stageId: Number(v.stageId),
        season: v.season || null,
        nutrient: v.nutrient,
        fertilizer: v.fertilizer,
        soilThreshold: Number(v.soilThreshold),
        doseUnderThreshold: Number(v.doseUnderThreshold),
        doseAboveThreshold: Number(v.doseAboveThreshold),
      })}
      fields={({ values }) => {
        const cropStages = stages.filter((s) => s.crop_id === Number(values.cropId));
        return (
          <>
            <FormField
              label="Crop"
              name="cropId"
              as="select"
              options={crops.map((c) => ({ value: c.id, label: c.name }))}
            />
            <FormField
              label="Stage"
              name="stageId"
              as="select"
              options={(cropStages.length ? cropStages : stages).map((s) => ({
                value: s.id,
                label: s.stage_name,
              }))}
            />
            <FormField label="Season" name="season" placeholder="Rabi" />
            <div className="form-row">
              <FormField
                label="Nutrient"
                name="nutrient"
                as="select"
                options={[
                  { value: 'Nitrogen', label: 'Nitrogen' },
                  { value: 'Phosphorus', label: 'Phosphorus' },
                  { value: 'Potash', label: 'Potash' },
                ]}
              />
              <FormField label="Fertilizer" name="fertilizer" placeholder="Urea" />
            </div>
            <FormField label="Soil Threshold (kg/ha)" name="soilThreshold" type="number" step="0.01" />
            <div className="form-row">
              <FormField label="Dose if Below (kg/ha)" name="doseUnderThreshold" type="number" step="0.01" />
              <FormField label="Dose if Above (kg/ha)" name="doseAboveThreshold" type="number" step="0.01" />
            </div>
          </>
        );
      }}
    />
  );
}
