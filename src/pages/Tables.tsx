import { useEffect, useState } from "react"
import { TableCard } from "../components"
import { getAllTables } from "../services/table"
import { getErrorMessage } from "../services/http"
import { type Table } from "../services/table"

export default function Dashboard() {
    const [tables, setTables] = useState<Table[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    useEffect ( () => {
        async function fetchTables () {
            try {
                const data = await getAllTables()
                const sortedTables = [...data].sort((a,b) => 
                    a.tableCode.localeCompare(b.tableCode, undefined, {
                        numeric: true
                    })
                )
                setTables(sortedTables)
            } catch (err) {
                setError(getErrorMessage(err))
            } finally {
                setIsLoading(false)
            }
        }

        fetchTables()
    }, [])

    if (isLoading) {
        return <p className="p-6">Loading tables...</p>
    }

    if (error) {
        return <p className="p-6 text-error">{error}</p>
    }

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tables.map((table) => (
                    <TableCard key={table.tableCode} {...table}>
                    </TableCard>
                ))}
            </div>
        </div>
    )
}