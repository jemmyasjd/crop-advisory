import * as Yup from 'yup';
import CrudPage from '../components/CrudPage';
import FormField from '../components/FormField';
import useOptions from '../hooks/useOptions';
import { diseaseRulesApi } from '../api/services';

const OPERATORS = ['BETWEEN', 'GTE', 'LTE', 'GT', 'LT', 'EQ'];

const schema = Yup.object({
  diseaseId: Yup.number().typeError('Select a disease').required('Disease is required'),
  ruleName: Yup.string().trim().nullable(),
  parameter: Yup.string().trim().required('Parameter is required'),
  operator: Yup.string().oneOf(OPERATORS).required('Operator is required'),
  minValue: Yup.number().typeError('Must be a number').nullable(),
  maxValue: Yup.number().typeError('Must be a number').nullable(),
  consecutiveDays: Yup.number().typeError('Must be a number').min(1).nullable(),
  score: Yup.number().typeError('Must be a number').required('Score is required'),
});

const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

export default function DiseaseRules() {
  const { diseases } = useOptions({ diseases: true });
  const diseaseName = (id) => diseases.find((d) => d.id === id)?.disease_name || `#${id}`;

  return (
    <CrudPage
      title="Disease Risk Rules"
      singular="Rule"
      api={diseaseRulesApi}
      searchKeys={['rule_name', 'parameter']}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'disease_id', label: 'Disease', render: (r) => diseaseName(r.disease_id) },
        { key: 'rule_name', label: 'Rule' },
        { key: 'parameter', label: 'Parameter' },
        { key: 'operator', label: 'Op', render: (r) => <span className="badge badge-gray">{r.operator}</span> },
        {
          key: 'range',
          label: 'Min / Max',
          render: (r) => `${r.min_value ?? '—'} / ${r.max_value ?? '—'}`,
        },
        { key: 'consecutive_days', label: 'Days' },
        { key: 'score', label: 'Score', render: (r) => <span className="badge badge-green">+{r.score}</span> },
      ]}
      rowName={(r) => r.rule_name || r.parameter}
      toInitialValues={(r) => ({
        diseaseId: r.disease_id ?? (diseases[0]?.id || ''),
        ruleName: r.rule_name || '',
        parameter: r.parameter || '',
        operator: r.operator || 'BETWEEN',
        minValue: r.min_value ?? '',
        maxValue: r.max_value ?? '',
        consecutiveDays: r.consecutive_days ?? '',
        score: r.score ?? '',
      })}
      validationSchema={schema}
      toPayload={(v) => ({
        diseaseId: Number(v.diseaseId),
        ruleName: v.ruleName || v.parameter,
        parameter: v.parameter,
        operator: v.operator,
        minValue: num(v.minValue),
        maxValue: num(v.maxValue),
        consecutiveDays: num(v.consecutiveDays),
        score: Number(v.score),
      })}
      fields={() => (
        <>
          <FormField
            label="Disease"
            name="diseaseId"
            as="select"
            options={diseases.map((d) => ({ value: d.id, label: d.disease_name }))}
          />
          <FormField label="Rule Name" name="ruleName" placeholder="Temperature" />
          <FormField
            label="Parameter"
            name="parameter"
            as="select"
            options={[
              { value: 'avg_temperature', label: 'avg_temperature' },
              { value: 'humidity', label: 'humidity' },
              { value: 'soil_moisture', label: 'soil_moisture' },
            ]}
          />
          <FormField
            label="Operator"
            name="operator"
            as="select"
            options={OPERATORS.map((o) => ({ value: o, label: o }))}
          />
          <div className="form-row">
            <FormField label="Min Value" name="minValue" type="number" step="0.01" />
            <FormField label="Max Value" name="maxValue" type="number" step="0.01" />
          </div>
          <div className="form-row">
            <FormField label="Consecutive Days" name="consecutiveDays" type="number" />
            <FormField label="Score" name="score" type="number" />
          </div>
        </>
      )}
    />
  );
}
