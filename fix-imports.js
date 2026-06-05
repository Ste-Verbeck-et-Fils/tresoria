import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, 'src')

const files = [
  'pages/public/dashboard/ProfileDashboard.jsx',
  'pages/public/dashboard/NotificationsDashboard.jsx',
  'modules/tresorerie/pages/TresoreriePage.jsx',
  'modules/tresorerie/pages/RapportFinancierAnneePage.jsx',
  'modules/depenses/pages/CreateDepensePage.jsx',
  'modules/depenses/pages/DepensesPage.jsx',
  'modules/students/pages/StudentDetailPage.jsx',
  'modules/students/pages/CreateStudentPage.jsx',
  'modules/anneesScolaires/pages/AnneesScolairesPage.jsx',
  'modules/anneesScolaires/pages/AnneeScolaireDetailPage.jsx',
  'modules/depenses/pages/DepenseDetailPage.jsx',
  'modules/classes/pages/ClasseFormPage.jsx',
  'modules/adresses/pages/CreateAdressePage.jsx',
  'modules/adresses/pages/AdressesPage.jsx',
  'modules/paiements/pages/CreatePaiementPage.jsx',
  'modules/paiements/pages/PaiementsPage.jsx',
  'modules/paiements/pages/PaiementDetailPage.jsx',
  'modules/classes/pages/ClasseDetailPage.jsx',
  'modules/parents/pages/ParentDetailPage.jsx',
  'modules/inscriptions/pages/InscriptionDetailPage.jsx',
  'modules/inscriptions/pages/InscriptionsPage.jsx',
  'modules/inscriptions/pages/CreateInscriptionPage.jsx',
  'modules/adresses/pages/AdresseDetailPage.jsx'
]

files.forEach(file => {
  const absolutePath = path.join(srcDir, file)
  if (!fs.existsSync(absolutePath)) return

  let content = fs.readFileSync(absolutePath, 'utf8')

  const loaderImportRegex = /^.*import Loader from.*$/gm
  const loaderImports = []
  let match
  while ((match = loaderImportRegex.exec(content)) !== null) {
    loaderImports.push(match[0].trim())
  }

  if (loaderImports.length > 0) {
    content = content.replace(/^.*import Loader from.*$/gm, '')
    content = loaderImports[0] + '\n' + content.trimStart()

    fs.writeFileSync(absolutePath, content)
    console.log('Fixed imports in ' + file)
  }
})
