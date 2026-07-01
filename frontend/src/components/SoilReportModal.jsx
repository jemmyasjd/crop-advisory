import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Modal from './Modal';
import FormField from './FormField';

// Mirrors backend Joi (soilReport.validation.js create).
const schema = Yup.object({
  reportDate: Yup.date().typeError('Enter a valid date').max(new Date(), 'Cannot be in the future').nullable(),
  nitrogen: Yup.number().typeError('Enter a number').min(0, 'Must be ≥ 0').required('Nitrogen is required'),
  phosphorus: Yup.number().typeError('Enter a number').min(0, 'Must be ≥ 0').required('Phosphorus is required'),
  potassium: Yup.number().typeError('Enter a number').min(0, 'Must be ≥ 0').required('Potassium is required'),
  soilMoisture: Yup.number().typeError('Enter a number').min(0).max(100, 'Max 100%').nullable(),
});

export default function SoilReportModal({ onClose, onSubmit }) {
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await onSubmit({
        reportDate: values.reportDate || undefined,
        nitrogen: Number(values.nitrogen),
        phosphorus: Number(values.phosphorus),
        potassium: Number(values.potassium),
        soilMoisture:
          values.soilMoisture === '' || values.soilMoisture === null
            ? undefined
            : Number(values.soilMoisture),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{
        reportDate: '',
        nitrogen: '',
        phosphorus: '',
        potassium: '',
        soilMoisture: '',
      }}
      validationSchema={schema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, submitForm }) => (
        <Modal
          title="Upload Soil Report"
          onClose={onClose}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={submitForm} disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save Report'}
              </button>
            </>
          }
        >
          <Form>
            <div className="form-row">
              <FormField label="Nitrogen (kg/ha)" name="nitrogen" type="number" step="0.1" />
              <FormField label="Phosphorus (kg/ha)" name="phosphorus" type="number" step="0.1" />
            </div>
            <div className="form-row">
              <FormField label="Potassium (kg/ha)" name="potassium" type="number" step="0.1" />
              <FormField label="Soil Moisture (%)" name="soilMoisture" type="number" step="0.1" hint="% of capacity" />
            </div>
            <FormField label="Report Date (optional)" name="reportDate" type="date" hint="Defaults to today." />
          </Form>
        </Modal>
      )}
    </Formik>
  );
}
