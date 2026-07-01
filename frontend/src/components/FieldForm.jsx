import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import FormField from './FormField';

// The three Indian cropping seasons (matches backend Joi valid()).
const SEASONS = ['Rabi', 'Kharif', 'Zaid'];

// Mirrors backend Joi (field.validation.js).
const schema = Yup.object({
  name: Yup.string().trim().min(1).max(150).required('Field name is required'),
  cropId: Yup.number().typeError('Select a crop').required('Crop is required'),
  season: Yup.string().oneOf(SEASONS, 'Select a season').required('Season is required'),
  areaHectare: Yup.number()
    .typeError('Enter a number')
    .positive('Must be greater than 0')
    .required('Area is required'),
  plantingDate: Yup.date()
    .typeError('Enter a valid date')
    .max(new Date(), 'Planting date cannot be in the future')
    .required('Planting date is required'),
  latitude: Yup.number().typeError('Enter a number').min(-90).max(90).nullable(),
  longitude: Yup.number().typeError('Enter a number').min(-180).max(180).nullable(),
});

const toNum = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

/**
 * Reusable create/edit field form.
 * @param {object} props
 * @param {object} props.initial          - initial values (for edit)
 * @param {Array}  props.crops            - crop options
 * @param {(payload)=>Promise} props.onSubmit
 * @param {string} props.submitLabel
 * @param {()=>void} props.onCancel
 */
export default function FieldForm({ initial, crops, onSubmit, submitLabel = 'Save', onCancel }) {
  const initialValues = {
    name: initial?.name || '',
    cropId: initial?.cropId ?? (crops[0]?.id || ''),
    season: initial?.season || '',
    areaHectare: initial?.areaHectare ?? '',
    plantingDate: initial?.plantingDate || '',
    latitude: initial?.latitude ?? '',
    longitude: initial?.longitude ?? '',
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await onSubmit({
        name: values.name,
        cropId: Number(values.cropId),
        season: values.season,
        areaHectare: Number(values.areaHectare),
        plantingDate: values.plantingDate,
        latitude: toNum(values.latitude),
        longitude: toNum(values.longitude),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ isSubmitting }) => (
        <Form>
          <FormField label="Field Name" name="name" placeholder="Farm 1" />
          <FormField
            label="Crop"
            name="cropId"
            as="select"
            options={crops.map((c) => ({ value: c.id, label: c.name }))}
          />
          <div className="form-row">
            <FormField
              label="Season"
              name="season"
              as="select"
              options={[
                { value: '', label: 'Select season…' },
                ...SEASONS.map((s) => ({ value: s, label: s })),
              ]}
            />
            <FormField label="Area (hectares)" name="areaHectare" type="number" step="0.01" placeholder="4.5" />
          </div>
          <FormField
            label="Planting Date"
            name="plantingDate"
            type="date"
            hint="Used to calculate crop stage (days after planting & GDD)."
          />
          <div className="form-row">
            <FormField label="Latitude (optional)" name="latitude" type="number" step="any" placeholder="22.3072" hint="For real weather data." />
            <FormField label="Longitude (optional)" name="longitude" type="number" step="any" placeholder="73.1812" />
          </div>

          <div className="row-actions" style={{ marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : submitLabel}
            </button>
            {onCancel && (
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
}
