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
  let changed = false

  const divRegex = /<div\s+className=['"](inscription-loading|profile-dashboard__loading)['"][^>]*>([\s\S]*?)<\/div>/g
  content = content.replace(divRegex, (match, className, message) => {
    changed = true
    return `<Loader message='${message.trim()}' />`
  })

  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/g
  content = content.replace(pRegex, (match, message) => {
    if (message.toLowerCase().includes('chargement') && !match.includes('<Loader')) {
      changed = true
      return `<Loader message='${message.trim()}' />`
    }
    return match
  })

  if (changed) {
    if (!content.includes('import Loader')) {
      const fileDir = path.dirname(absolutePath)
      let relativePath = path.relative(fileDir, path.join(srcDir, 'components/ui/Loader'))
      if (!relativePath.startsWith('.')) relativePath = './' + relativePath

      const importRegex = /^import.*$/gm
      let lastMatch
      let match
      while ((match = importRegex.exec(content)) !== null) {
        lastMatch = match
      }

      const importStatement = `\nimport Loader from '${relativePath}'`
      if (lastMatch) {
        content = content.slice(0, lastMatch.index + lastMatch[0].length) + importStatement + content.slice(lastMatch.index + lastMatch[0].length)
      } else {
        content = importStatement + '\n' + content
      }
    }
    fs.writeFileSync(absolutePath, content)
    console.log('Updated ' + file)
  }
})
