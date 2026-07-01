import * as Yup from 'yup';
import CrudPage from '../components/CrudPage';
import FormField from '../components/FormField';
import useOptions from '../hooks/useOptions';
import { riskLevelsApi } from '../api/services';

const schema = Yup.object({
  diseaseId: Yup.number().typeError('Select a disease').required('Disease is required'),
  minScore: Yup.number().typeError('Must be a number').required('Min score is required'),
  maxScore: Yup.number()
    .typeError('Must be a number')
    .required('Max score is required')
    .test('gte', 'Max must be ≥ Min', function (v) {
      return v == null || this.parent.minScore == null || v >= this.parent.minScore;
    }),
  riskLevel: Yup.string().trim().required('Risk level is required'),
  advisory: Yup.string().trim().required('Advisory is required'),
});

const levelBadge = (lvl) => {
  const up = String(lvl).toUpperCase();
  const cls = up === 'HIGH' ? 'badge-red' : up === 'MODERATE' ? 'badge-amber' : 'badge-green';
  return <span className={`badge ${cls}`}>{up}</span>;
};

export default function RiskLevels() {
  const { diseases } = useOptions({ diseases: true });
  const diseaseName = (id) => diseases.find((d) => d.id === id)?.disease_name || `#${id}`;

  return (
    <CrudPage
      title="Disease Risk Levels"
      singular="Level"
      api={riskLevelsApi}
      searchKeys={['risk_level']}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'disease_id', label: 'Disease', render: (r) => diseaseName(r.disease_id) },
        { key: 'range', label: 'Score Range', render: (r) => `${r.min_score} – ${r.max_score}` },
        { key: 'risk_level', label: 'Level', render: (r) => levelBadge(r.risk_level) },
        {
          key: 'advisory',
          label: 'Advisory',
          render: (r) => (r.advisory?.length > 50 ? r.advisory.slice(0, 50) + '…' : r.advisory),
        },
      ]}
      rowName={(r) => `${r.risk_level} (${r.min_score}–${r.max_score})`}
      toInitialValues={(r) => ({
        diseaseId: r.disease_id ?? (diseases[0]?.id || ''),
        minScore: r.min_score ?? '',
        maxScore: r.max_score ?? '',
        riskLevel: r.risk_level || '',
        advisory: r.advisory || '',
      })}
      validationSchema={schema}
      toPayload={(v) => ({
        diseaseId: Number(v.diseaseId),
        minScore: Number(v.minScore),
        maxScore: Number(v.maxScore),
        riskLevel: v.riskLevel,
        advisory: v.advisory,
      })}
      fields={() => (
        <>
          <FormField
            label="Disease"
            name="diseaseId"
            as="select"
            options={diseases.map((d) => ({ value: d.id, label: d.disease_name }))}
          />
          <div className="form-row">
            <FormField label="Min Score" name="minScore" type="number" />
            <FormField label="Max Score" name="maxScore" type="number" />
          </div>
          <FormField
            label="Risk Level"
            name="riskLevel"
            as="select"
            options={[
              { value: 'LOW', label: 'LOW' },
              { value: 'MODERATE', label: 'MODERATE' },
              { value: 'HIGH', label: 'HIGH' },
            ]}
          />
          <FormField label="Advisory Message" name="advisory" as="textarea" />
        </>
      )}
    />
  );
}
