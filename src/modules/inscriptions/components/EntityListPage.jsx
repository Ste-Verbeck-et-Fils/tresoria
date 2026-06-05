import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import { normalizeCollection } from '../utils/data'
import ModuleState from './ModuleState'
import Loader from '../../../components/ui/Loader'
import { getSocket } from '../../../services/socketService'

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
  searchItems,
  successMessage,
  beforePanel,
  kicker,
  socketEvents,
}) => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [searchedItems, setSearchedItems] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const payload = await loadItems()
      setItems(normalizeCollection(payload))
      setSearchedItems(null)
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les donnees.')
    } finally {
      setIsLoading(false)
    }
  }, [loadItems])

  const handleSearch = useCallback(async () => {
    if (!searchItems) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const normalizedSearch = search.trim()
      const payload = normalizedSearch
        ? await searchItems(normalizedSearch)
        : await loadItems()
      const normalizedItems = normalizeCollection(payload)

      if (normalizedSearch) {
        setSearchedItems(normalizedItems)
      } else {
        setItems(normalizedItems)
        setSearchedItems(null)
      }
    } catch (searchError) {
      setError(searchError.message || 'Impossible d effectuer la recherche.')
    } finally {
      setIsLoading(false)
    }
  }, [loadItems, search, searchItems])

  const handleSearchChange = (event) => {
    setSearch(event.target.value)
    setSearchedItems(null)
  }

  useEffect(() => {
    let isCancelled = false

    Promise.resolve()
      .then(() => {
        if (!isCancelled) {
          setIsLoading(true)
          setError('')
          setSearchedItems(null)
        }

        return loadItems()
      })
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

  useEffect(() => {
    if (!socketEvents) return

    const socket = getSocket()

    const handleCreated = (newItem) => {
      setItems((prev) => {
        if (prev.find((item) => item.id === newItem.id)) return prev
        return [newItem, ...prev]
      })
      setSearchedItems((prev) => {
        if (!prev) return prev
        if (prev.find((item) => item.id === newItem.id)) return prev
        return [newItem, ...prev]
      })
    }

    const handleUpdated = (updatedItem) => {
      setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
      setSearchedItems((prev) => {
        if (!prev) return prev
        return prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      })
    }

    const handleDeleted = (deletedId) => {
      setItems((prev) => prev.filter((item) => item.id !== deletedId))
      setSearchedItems((prev) => {
        if (!prev) return prev
        return prev.filter((item) => item.id !== deletedId)
      })
    }

    if (socketEvents.created) socket.on(socketEvents.created, handleCreated)
    if (socketEvents.updated) socket.on(socketEvents.updated, handleUpdated)
    if (socketEvents.deleted) socket.on(socketEvents.deleted, handleDeleted)

    return () => {
      if (socketEvents.created) socket.off(socketEvents.created, handleCreated)
      if (socketEvents.updated) socket.off(socketEvents.updated, handleUpdated)
      if (socketEvents.deleted) socket.off(socketEvents.deleted, handleDeleted)
    }
  }, [socketEvents])

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const sourceItems = searchedItems ?? items

    if (!normalizedSearch) {
      return sourceItems
    }

    return sourceItems.filter((item) => {
      const searchableValue = getSearchText
        ? getSearchText(item)
        : columns.map((column) => column.render(item)).join(' ')

      return String(searchableValue).toLowerCase().includes(normalizedSearch)
    })
  }, [columns, getSearchText, items, search, searchedItems])

  return (
    <section className='inscription-page'>
      <header className='inscription-page-header'>
        <div>
          {kicker && <p className='inscription-page-kicker'>{kicker}</p>}
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

      {beforePanel}

      <div className='inscription-panel'>
        <div className='inscription-toolbar'>
          <Input
            id={`${title.toLowerCase().replace(/\s+/g, '-')}-search`}
            type='search'
            variant='searchbox'
            placeholder={searchPlaceholder}
            value={search}
            icon={<Search size={18} />}
            onChange={handleSearchChange}
            onSearch={searchItems ? handleSearch : undefined}
            onKeyDown={(event) => {
              if (searchItems && event.key === 'Enter') {
                event.preventDefault()
                handleSearch()
              }
            }}
            className='inscription-search'
          />
          <span className='inscription-count'>{filteredItems.length} element(s)</span>
        </div>

        {isLoading && (
          <Loader message='Chargement en cours...' />
        )}

        {!isLoading && error && (
          <ModuleState
            type='error'
            title='Echec du chargement'
            message={error}
            actionLabel='Reessayer'
            onAction={searchItems ? handleSearch : load}
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
