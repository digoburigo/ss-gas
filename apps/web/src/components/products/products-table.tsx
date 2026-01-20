import type { ColumnDef, ColumnPinningState } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit,
  MoreVertical,
  Search,
  Trash2,
} from "lucide-react";

import type { Product } from "@acme/zen-v3/zenstack/models";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader } from "@acme/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Input } from "@acme/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

interface ProductsTableProps {
  products: Product[];
  onDelete: (product: Product) => void;
}

export function ProductsTable({ products, onDelete }: ProductsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [columnPinning] = useState<ColumnPinningState>({
    right: ["actions"],
  });

  // Get unique categories
  const categories = useMemo(() => {
    const cats = products
      .map((p) => p.category)
      .filter((c): c is string => Boolean(c));
    return Array.from(new Set(cats));
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;

      // Active filter
      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" && product.active) ||
        (activeFilter === "inactive" && !product.active);

      return matchesSearch && matchesCategory && matchesActive;
    });
  }, [products, searchQuery, categoryFilter, activeFilter]);

  // Define columns
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => {
          return (
            <Button
              className="h-auto p-0 font-medium hover:bg-transparent"
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Código
              {column.getIsSorted() === false && (
                <ArrowUpDown className="ml-2 size-4 opacity-50" />
              )}
              {column.getIsSorted() === "asc" && (
                <ArrowUp className="ml-2 size-4" />
              )}
              {column.getIsSorted() === "desc" && (
                <ArrowDown className="ml-2 size-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <span className="font-medium">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              className="h-auto p-0 font-medium hover:bg-transparent"
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Nome
              {column.getIsSorted() === false && (
                <ArrowUpDown className="ml-2 size-4 opacity-50" />
              )}
              {column.getIsSorted() === "asc" && (
                <ArrowUp className="ml-2 size-4" />
              )}
              {column.getIsSorted() === "desc" && (
                <ArrowDown className="ml-2 size-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <span
            className="block max-w-[200px] truncate"
            title={row.original.name}
          >
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: ({ column }) => {
          return (
            <Button
              className="h-auto p-0 font-medium hover:bg-transparent"
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Categoria
              {column.getIsSorted() === false && (
                <ArrowUpDown className="ml-2 size-4 opacity-50" />
              )}
              {column.getIsSorted() === "asc" && (
                <ArrowUp className="ml-2 size-4" />
              )}
              {column.getIsSorted() === "desc" && (
                <ArrowDown className="ml-2 size-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => row.original.category ?? "-",
      },
      {
        accessorKey: "unit",
        header: "Unidade",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.original.unit ?? "-"}</span>
        ),
      },
      {
        accessorKey: "costPrice",
        header: ({ column }) => {
          return (
            <Button
              className="h-auto p-0 font-medium hover:bg-transparent"
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Preço de Custo
              {column.getIsSorted() === false && (
                <ArrowUpDown className="ml-2 size-4 opacity-50" />
              )}
              {column.getIsSorted() === "asc" && (
                <ArrowUp className="ml-2 size-4" />
              )}
              {column.getIsSorted() === "desc" && (
                <ArrowDown className="ml-2 size-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {row.original.costPrice
              ? `R$ ${row.original.costPrice.toFixed(2)}`
              : "-"}
          </span>
        ),
      },
      {
        accessorKey: "salePrice",
        header: ({ column }) => {
          return (
            <Button
              className="h-auto p-0 font-medium hover:bg-transparent"
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Preço de Venda
              {column.getIsSorted() === false && (
                <ArrowUpDown className="ml-2 size-4 opacity-50" />
              )}
              {column.getIsSorted() === "asc" && (
                <ArrowUp className="ml-2 size-4" />
              )}
              {column.getIsSorted() === "desc" && (
                <ArrowDown className="ml-2 size-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {row.original.salePrice
              ? `R$ ${row.original.salePrice.toFixed(2)}`
              : "-"}
          </span>
        ),
      },
      {
        accessorKey: "minimumStock",
        header: "Estoque Mínimo",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {row.original.minimumStock ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "storageLocation",
        header: "Local de Armazenamento",
        cell: ({ row }) => (
          <span
            className="block max-w-[150px] truncate whitespace-nowrap"
            title={row.original.storageLocation ?? undefined}
          >
            {row.original.storageLocation ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "active",
        header: "Ativo",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {row.original.active ? (
              <span className="text-green-600 dark:text-green-400">Sim</span>
            ) : (
              <span className="text-red-600 dark:text-red-400">Não</span>
            )}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="w-[100px] whitespace-nowrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                    size="icon"
                  >
                    <MoreVertical />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem asChild>
                    <Link
                      to="/products/$id"
                      params={{ id: product.id }}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 size-4" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={() => onDelete(product)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enablePinning: true,
      },
    ],
    [onDelete],
  );

  const table = useReactTable({
    data: filteredProducts,
    columns,
    state: {
      columnPinning,
    },
    enableColumnPinning: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              className="pl-9"
              placeholder="Buscar por nome ou código..."
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table classNameWrapper="min-w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const { column } = header;
                    const isPinned = column.getIsPinned();
                    return (
                      <TableHead
                        key={header.id}
                        className={isPinned ? "bg-background" : ""}
                        style={{
                          position: isPinned ? "sticky" : "relative",
                          right:
                            isPinned === "right"
                              ? `${column.getAfter("right")}px`
                              : undefined,
                          zIndex: isPinned ? 10 : 0,
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      const { column } = cell;
                      const isPinned = column.getIsPinned();
                      return (
                        <TableCell
                          key={cell.id}
                          className={isPinned ? "bg-background" : ""}
                          style={{
                            position: isPinned ? "sticky" : "relative",
                            right:
                              isPinned === "right"
                                ? `${column.getAfter("right")}px`
                                : undefined,
                            zIndex: isPinned ? 10 : 0,
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
