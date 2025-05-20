"use client"

import { useState } from "react"
import { MoreHorizontal, ChevronDown, Search, ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const opportunities = [
  {
    id: "OPP-1234",
    name: "Enterprise Software Deal",
    account: "Acme Inc.",
    stage: "Qualification",
    amount: "$75,000",
    closeDate: "2023-06-15",
    owner: "John Smith",
  },
  {
    id: "OPP-1235",
    name: "Cloud Migration Project",
    account: "TechCorp",
    stage: "Proposal",
    amount: "$120,000",
    closeDate: "2023-07-22",
    owner: "Sarah Johnson",
  },
  {
    id: "OPP-1236",
    name: "Security Upgrade",
    account: "Global Industries",
    stage: "Negotiation",
    amount: "$45,000",
    closeDate: "2023-05-30",
    owner: "Michael Brown",
  },
  {
    id: "OPP-1237",
    name: "SaaS Implementation",
    account: "Innovative Startups",
    stage: "Closed Won",
    amount: "$95,000",
    closeDate: "2023-04-10",
    owner: "Emily Davis",
  },
  {
    id: "OPP-1238",
    name: "Hardware Refresh",
    account: "Strategic Solutions",
    stage: "Discovery",
    amount: "$150,000",
    closeDate: "2023-08-05",
    owner: "Robert Wilson",
  },
]

export function OpportunitiesTable() {
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([])

  const toggleSelectAll = () => {
    if (selectedOpportunities.length === opportunities.length) {
      setSelectedOpportunities([])
    } else {
      setSelectedOpportunities(opportunities.map((opp) => opp.id))
    }
  }

  const toggleSelectOpportunity = (id: string) => {
    if (selectedOpportunities.includes(id)) {
      setSelectedOpportunities(selectedOpportunities.filter((oppId) => oppId !== id))
    } else {
      setSelectedOpportunities([...selectedOpportunities, id])
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Discovery":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "Qualification":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "Proposal":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "Negotiation":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "Closed Won":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search opportunities..." className="w-full pl-8 sm:w-[300px]" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto h-9">
                <ChevronDown className="h-4 w-4" />
                <span className="sr-only">Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Stage</DropdownMenuItem>
              <DropdownMenuItem>Amount</DropdownMenuItem>
              <DropdownMenuItem>Close Date</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="10">
            <SelectTrigger className="h-9 w-[70px]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <Button>Add Opportunity</Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedOpportunities.length === opportunities.length && opportunities.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Account</TableHead>
              <TableHead>
                <div className="flex items-center">
                  Stage
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <div className="flex items-center">
                  Amount
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <div className="flex items-center">
                  Close Date
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">Owner</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((opportunity) => (
              <TableRow key={opportunity.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedOpportunities.includes(opportunity.id)}
                    onCheckedChange={() => toggleSelectOpportunity(opportunity.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{opportunity.id}</TableCell>
                <TableCell>{opportunity.name}</TableCell>
                <TableCell className="hidden md:table-cell">{opportunity.account}</TableCell>
                <TableCell>
                  <Badge className={getStageColor(opportunity.stage)}>{opportunity.stage}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">{opportunity.amount}</TableCell>
                <TableCell className="hidden md:table-cell">{opportunity.closeDate}</TableCell>
                <TableCell className="hidden md:table-cell">{opportunity.owner}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <strong>1</strong> to <strong>{opportunities.length}</strong> of{" "}
          <strong>{opportunities.length}</strong> results
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

