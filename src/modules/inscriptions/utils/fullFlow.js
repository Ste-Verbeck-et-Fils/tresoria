const trim = (value) => String(value ?? '').trim()

const compact = (values) => Object.fromEntries(
  Object.entries(values)
    .map(([key, value]) => [key, trim(value)])
    .filter(([, value]) => value)
)

export const FULL_FLOW_STEPS = [
  { id: 'parents', label: 'Parents' },
  { id: 'student', label: 'Eleve' },
  { id: 'school', label: 'Classe et annee' },
  { id: 'summary', label: 'Resume' },
]

export const FULL_FLOW_GENDER_OPTIONS = [
  { value: 'M', label: 'Masculin' },
  { value: 'F', label: 'Feminin' },
]

export const createEmptyFlowAdresse = () => ({
  quartier: '',
  commune: '',
  avenue: '',
})

export const createEmptyFlowParent = (gender, phone = '') => ({
  full_name: '',
  phone,
  profession: '',
  gender,
  withAdresse: false,
  adresse: createEmptyFlowAdresse(),
})

export const createEmptyFlowStudent = () => ({
  nom: '',
  postnom: '',
  prenom: '',
  date_naissance: '',
  lieu_naissance: '',
  genre: '',
  province_origine: '',
  territoire_origine: '',
  collectivite_origine: '',
  groupement_origine: '',
  localite_origine: '',
  withAdresse: false,
  adresse: createEmptyFlowAdresse(),
})

export const validateFlowAdresse = (adresse) => {
  const errors = {}

  if (!trim(adresse.quartier)) {
    errors.quartier = 'Le quartier est obligatoire.'
  }

  return errors
}

export const validateFlowParent = (parent) => {
  const errors = {}

  if (!trim(parent.full_name)) {
    errors.full_name = 'Le nom complet est obligatoire.'
  }

  if (!trim(parent.phone)) {
    errors.phone = 'Le telephone est obligatoire.'
  }

  if (!trim(parent.profession)) {
    errors.profession = 'La profession est obligatoire.'
  }

  if (parent.withAdresse) {
    errors.adresse = validateFlowAdresse(parent.adresse)
  }

  return errors
}

export const validateFlowStudent = (student) => {
  const errors = {}

  if (!trim(student.nom)) {
    errors.nom = 'Le nom est obligatoire.'
  }

  if (!trim(student.postnom)) {
    errors.postnom = 'Le postnom est obligatoire.'
  }

  if (!trim(student.prenom)) {
    errors.prenom = 'Le prenom est obligatoire.'
  }

  if (!trim(student.date_naissance)) {
    errors.date_naissance = 'La date de naissance est obligatoire.'
  } else if (Number.isNaN(new Date(`${student.date_naissance}T00:00:00.000Z`).getTime())) {
    errors.date_naissance = 'La date de naissance est invalide.'
  }

  if (!trim(student.lieu_naissance)) {
    errors.lieu_naissance = 'Le lieu de naissance est obligatoire.'
  }

  if (!FULL_FLOW_GENDER_OPTIONS.some(({ value }) => value === student.genre)) {
    errors.genre = 'Le genre est obligatoire.'
  }

  if (student.withAdresse) {
    errors.adresse = validateFlowAdresse(student.adresse)
  }

  return errors
}

export const hasValidationErrors = (errors) => (
  Object.values(errors).some((value) => (
    typeof value === 'object' ? hasValidationErrors(value) : Boolean(value)
  ))
)

export const getFlowAdressePayload = (adresse) => compact({
  quartier: adresse.quartier,
  commune: adresse.commune,
  avenue: adresse.avenue,
})

export const getCreateFlowParentPayload = (parent) => ({
  full_name: trim(parent.full_name),
  phone: trim(parent.phone),
  profession: trim(parent.profession),
  gender: parent.gender,
  ...(parent.withAdresse ? { adresse: getFlowAdressePayload(parent.adresse) } : {}),
})

const getOptionalStudentFields = (student) => compact({
  province_origine: student.province_origine,
  territoire_origine: student.territoire_origine,
  collectivite_origine: student.collectivite_origine,
  groupement_origine: student.groupement_origine,
  localite_origine: student.localite_origine,
})

export const getFullFlowPayload = ({
  pere,
  mere,
  student,
  classId,
  anneeScolaireId,
}) => ({
  ...(pere?.id ? { pere: { id: Number(pere.id) } } : {}),
  ...(mere?.id ? { mere: { id: Number(mere.id) } } : {}),
  student: {
    nom: trim(student.nom),
    postnom: trim(student.postnom),
    prenom: trim(student.prenom),
    date_naissance: new Date(`${student.date_naissance}T00:00:00.000Z`).toISOString(),
    lieu_naissance: trim(student.lieu_naissance),
    genre: student.genre,
    ...getOptionalStudentFields(student),
    ...(student.withAdresse ? { adresse: getFlowAdressePayload(student.adresse) } : {}),
  },
  class_id: Number(classId),
  annee_scolaire_id: Number(anneeScolaireId),
})
