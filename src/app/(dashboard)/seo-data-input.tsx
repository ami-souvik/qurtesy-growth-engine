"use client"

import { useState } from "react"
import Papa from "papaparse"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

type SeoDataState = {
  pages: any[]
  queries: any[]
  searchAppearance: any[]
}

export function SeoDataInput({ initialData }: { initialData?: string }) {
  const [data, setData] = useState<SeoDataState>(() => {
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData)
        if (parsed.pages || parsed.queries || parsed.searchAppearance) {
          return {
            pages: parsed.pages || [],
            queries: parsed.queries || [],
            searchAppearance: parsed.searchAppearance || []
          }
        }
      } catch (e) {
        // Not JSON, likely old text data, fallback to empty arrays
      }
    }
    return { pages: [], queries: [], searchAppearance: [] }
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, tab: keyof SeoDataState) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData((prev) => ({
          ...prev,
          [tab]: results.data,
        }))
      },
    })
    
    // Reset file input
    e.target.value = ""
  }

  const renderTable = (tab: keyof SeoDataState) => {
    const tableData = data[tab]
    if (tableData.length === 0) {
      return <div className="text-center py-8 text-muted-foreground text-sm border rounded-md">No data uploaded yet. Upload a CSV file.</div>
    }

    const headers = Object.keys(tableData[0])

    return (
      <div className="border rounded-md overflow-x-auto max-h-[300px]">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h) => (
                <TableHead key={h} className="whitespace-nowrap bg-muted/50 sticky top-0">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.slice(0, 50).map((row, i) => (
              <TableRow key={i}>
                {headers.map((h) => (
                  <TableCell key={h} className="whitespace-nowrap">{row[h]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {tableData.length > 50 && (
          <div className="text-center text-xs text-muted-foreground p-2 border-t">Showing first 50 rows of {tableData.length}. Full data is saved.</div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="seoData" value={JSON.stringify(data)} />
      
      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="queries">Queries</TabsTrigger>
          <TabsTrigger value="searchAppearance">Search Appearance</TabsTrigger>
        </TabsList>
        
        {(["pages", "queries", "searchAppearance"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4 pt-4 border rounded-md p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium capitalize">{tab.replace(/([A-Z])/g, ' $1').trim()} Data</h3>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, tab)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Upload CSV"
                />
                <Button size="sm" variant="outline" className="pointer-events-none">
                  <Upload className="w-4 h-4 mr-2" /> Upload CSV
                </Button>
              </div>
            </div>
            {renderTable(tab)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
