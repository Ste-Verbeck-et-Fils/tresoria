import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import { normalizeCollection } from '../utils/data'
import ModuleState from './ModuleState'

const EntityListPage = ({
  title,
  description,
  loadItems,
  columns,
  emptyMessage,
  createPath,
  createLabel,
  getRowPath,
  searchPlaceholder = 'Rechercher',
  getSearchText,
  successMessage,
}) => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const payload = await loadItems()
      setItems(normalizeCollection(payload))
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les donnees.')
    } finally {
      setIsLoading(false)
    }
  }, [loadItems])

  useEffect(() => {
    let isCancelled = false

    loadItems()
      .then((payload) => {
        if (!isCancelled) {
          setItems(normalizeCollection(payload))
        }
      })
      .catch((loadError) => {
        if (!isCancelled) {
          setError(loadError.message || 'Impossible de charger les donnees.')
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [loadItems])

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) {
      return items
    }

    return items.filter((item) => {
      const searchableValue = getSearchText
        ? getSearchText(item)
        : columns.map((column) => column.render(item)).join(' ')

      return String(searchableValue).toLowerCase().includes(normalizedSearch)
    })
  }, [columns, getSearchText, items, search])

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          <p className='inscription-page-kicker'>Module inscription</p>
          <h1>{title}</h1>
          {description && <p className='inscription-page-description'>{description}</p>}
        </div>
        {createPath && createLabel && (
          <Button
            type='button'
            variant='super'
            label={createLabel}
            icon={<Plus size={17} />}
            onClick={() => navigate(createPath)}
            className='inscription-action inscription-action--primary'
          />
        )}
      </header>

      {successMessage && <Feedback type='success' message={successMessage} />}

      <div className='inscription-panel'>
        <div className='inscription-toolbar'>
          <Input
            id={`${title.toLowerCase().replace(/\s+/g, '-')}-search`}
            type='search'
            variant='searchbox'
            placeholder={searchPlaceholder}
            value={search}
            icon={<Search size={18} />}
            onChange={(event) => setSearch(event.target.value)}
            className='inscription-search'
          />
          <span className='inscription-count'>{filteredItems.length} element(s)</span>
        </div>

        {isLoading && (
          <div className='inscription-loading' role='status'>
            Chargement en cours...
          </div>
        )}

        {!isLoading && error && (
          <ModuleState
            type='error'
            title='Echec du chargement'
            message={error}
            actionLabel='Reessayer'
            onAction={load}
          />
        )}

        {!isLoading && !error && filteredItems.length === 0 && (
          <ModuleState
            title='Aucun resultat'
            message={search ? 'Aucun element ne correspond a votre recherche.' : emptyMessage}
          />
        )}

        {!isLoading && !error && filteredItems.length > 0 && (
          <div className='inscription-table-wrapper'>
            <table className='inscription-table'>
              <thead>
                <tr>
                  {columns.map((column) => <th key={column.label}>{column.label}</th>)}
                  {getRowPath && <th className='inscription-table__action-heading'>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    {columns.map((column) => <td key={column.label}>{column.render(item)}</td>)}
                    {getRowPath && (
                      <td className='inscription-table__action'>
                        <Link to={getRowPath(item)} className='inscription-detail-link'>Voir le detail</Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default EntityListPage
