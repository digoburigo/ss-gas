import { useEffect, useState } from "react";

import type { Product } from "~/constants/mock-api";
import { fakeProducts } from "~/constants/mock-api";
import { ProductTable } from "./product-tables";
import { columns } from "./product-tables/columns";

export default function ProductListingPage() {
  const [data, setData] = useState<any[]>([]);

  const filters = {
    page: 1,
    limit: 10,
    search: "",
    categories: "",
  };

  // const data = await fakeProducts.getProducts(filters);

  useEffect(() => {
    fakeProducts.getProducts(filters).then((data) => {
      setData(data.products);
    });
  }, [filters]);

  const totalProducts = data.total_products;
  const products: Product[] = data.products;

  return (
    <ProductTable
      data={products}
      totalItems={totalProducts}
      columns={columns}
    />
  );
}
