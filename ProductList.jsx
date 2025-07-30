import React, { useEffect, useState } from "react";
import { getAllCategories } from "../services/categoryService";
import { getAllBrands } from "../services/brandService";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Typography, Grid, TextField, Autocomplete } from "@mui/material";
import axios from "axios";

const criticalRowClass = {
  backgroundColor: "rgba(199,36,36,0.68) !important",
  color: "#fff",
  fontWeight: "bold",
  animation: "critical-blink 1s linear infinite alternate",
};

const criticalRowStyle = `
@keyframes critical-blink {
  from { background-color: rgba(199,36,36,0.68); }
  to { background-color: rgba(255,59,59,0.96); }
}
`;

function ProductList() {
  const productFilters = [
    { value: "all", name: "Tüm Ürünler" },
    { value: "critical", name: "Kritik Stoktaki Ürünler" },
    { value: "outofstock", name: "Stokta Olmayan Ürünler" },
  ];

  const sortOptionsList = [
    { value: "serialnumber_asc", name: "Sıra No (Artan)" },
    { value: "serialnumber_desc", name: "Sıra No (Azalan)" },
    { value: "name_asc", name: "Ürün Adı (A-Z)" },
    { value: "name_desc", name: "Ürün Adı (Z-A)" },
    { value: "quantity_asc", name: "Stok (Artan)" },
    { value: "quantity_desc", name: "Stok (Azalan)" },
    { value: "category_asc", name: "Kategori (A-Z)" },
    { value: "category_desc", name: "Kategori (Z-A)" },
    { value: "brand_asc", name: "Marka (A-Z)" },
    { value: "brand_desc", name: "Marka (Z-A)" },
    { value: "createdAt_desc", name: "Eklenme Tarihi (Azalan)" },
    { value: "createdAt_asc", name: "Eklenme Tarihi (Artan)" },
  ];

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]); // Dizi!
  const [brands, setBrands] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [criticalLevel, setCriticalLevel] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("serialnumber_asc");

  const fetchInitialCriticalLevel = async () => {
    try {
      const res = await axios.get("http://localhost:5184/api/Product/Any");
      if (res.data?.criticalStockLevel !== undefined) {
        setCriticalLevel(res.data.criticalStockLevel);
      }
    } catch (err) {
      console.error("Başlangıç kritik seviyesi alınamadı:", err);
    }
  };

  const loadCategories = async () => {
    const data = await getAllCategories();
    setCategories(data);
  };

  const loadBrands = async () => {
    const data = await getAllBrands();
    setBrands(data);
  };

  const loadSortedProducts = async () => {
    const [orderBy, direction] = sortOption.split("_");
    try {
      const res = await axios.get(
        `http://localhost:5184/api/Product/Sorted?orderBy=${orderBy}&direction=${direction}`
      );
      setProducts(res.data);
    } catch (err) {
      console.error("Sıralı ürünler yüklenemedi:", err);
    }
  };

  useEffect(() => {
    fetchInitialCriticalLevel();
    loadCategories();
    loadBrands();
  }, []);

  useEffect(() => {
    loadSortedProducts();
  }, [sortOption]);

  const rows = products
    .filter((row) => {
      const matchesFilter =
        filterType === "all"
          ? true
          : filterType === "critical"
          ? row.quantity <= criticalLevel
          : row.quantity === 0;

      const matchesSearch = row.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesBrand =
        selectedBrands.length === 0
          ? true
          : selectedBrands.some(
              (brand) => String(brand.brandId) === String(row.brandId)
            );

      const matchesCategory =
        selectedCategories.length === 0
          ? true
          : selectedCategories.some((cat) => cat.categoryId === row.categoryId);

      return matchesFilter && matchesSearch && matchesBrand && matchesCategory;
    })
    .map((product, index) => ({
      ...product,
      id: product.productId,
    }));

  const getRowClassName = (params) =>
    filterType === "all" && params.row.quantity <= criticalLevel
      ? "critical-row"
      : "";

  const columns = [
    {
      field: "serialNumber",
      headerName: "Sıra No",
      flex: 1,
      minWidth: 70,
      renderCell: (params) => (
        <span style={{ color: "#ffffff", fontWeight: "bold" }}>
          {params.value}
        </span>
      ),
    },
    {
      field: "productId",
      headerName: "ID",
      flex: 1,
      minWidth: 90,
      renderCell: (params) => (
        <span style={{ color: "#ffffff", fontWeight: "bold" }}>
          {params.value}
        </span>
      ),
    },
    {
      field: "name",
      headerName: "Ürün Adı",
      flex: 2,
      minWidth: 130,
      renderCell: (params) => (
        <span style={{ color: "#ffffff", fontWeight: "bold" }}>
          {params.value}
        </span>
      ),
    },
    {
      field: "description",
      headerName: "Açıklama",
      flex: 2,
      minWidth: 130,
      renderCell: (params) => (
        <span style={{ color: "#ffffff", fontWeight: "bold" }}>
          {params.value || <i>Yok</i>}
        </span>
      ),
    },
    {
      field: "quantity",
      headerName: "Stok",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <span style={{ color: "#ffffff", fontWeight: "bold" }}>
          {params.value}
          {params.row.quantity <= criticalLevel && filterType === "all" && (
            <span style={{ marginLeft: "8px", fontSize: 18 }}>⚠</span>
          )}
        </span>
      ),
    },
    {
      field: "category",
      headerName: "Kategori",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <span style={{ color: "#ffffff", fontWeight: "bold" }}>
          {params.value}
        </span>
      ),
    },
    {
      field: "brand",
      headerName: "Marka",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <span style={{ color: "#ffffff", fontWeight: "bold" }}>
          {params.value || <i>Yok</i>}
        </span>
      ),
    },
    {
  field: "createdBy",
  headerName: "Ekleyen",
  flex: 1,
  minWidth: 120,
  renderCell: (params) => (
    <span style={{ color: "#ffffff", fontWeight: "bold" }}>
      {params.value || <i>Bilinmiyor</i>}
    </span>
  ),
},
    {
      field: "createdAt",
      headerName: "Eklenme Tarihi",
      flex: 2,
      minWidth: 150,
      renderCell: (params) => (
        <span style={{ color: "#ffffff", fontWeight: "bold" }}>
          {new Date(params.value).toLocaleString("tr-TR")}
        </span>
      ),
    },
  ];

  return (
    <Box
      sx={{ width: "100%", maxWidth: "100vw", minHeight: "92vh", m: 0, p: 0 }}
    >
      <style>{criticalRowStyle}</style>

      <Grid container spacing={0} sx={{ width: "100%", m: 0, p: 0 }}>
        <Grid sx={{ width: "100%", mt: 5 }}>
          <Typography variant="h5" gutterBottom color="#fff" fontWeight={700}>
            Ürün Listesi
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              mb: 2,
              alignItems: "center",
            }}
          >
            {/* Kategori */}
            <div style={{ minWidth: 170, maxWidth: 210 }}>
              <Autocomplete
                multiple
                size="small"
                options={categories
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))}
                getOptionLabel={(option) => option.name}
                value={selectedCategories}
                onChange={(event, value) => setSelectedCategories(value)}
                isOptionEqualToValue={(opt, val) =>
                  opt.categoryId === val.categoryId
                }
                disableCloseOnSelect
                renderTags={() => null}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: 15,
                    backgroundColor: "rgba(89,146,203,0.12)",
                    borderRadius: 1.5,
                    p: "2px 6px",
                    height: 36,
                    minHeight: 36,
                  },
                  minWidth: 170,
                  maxWidth: 210,
                }}
                slotProps={{
                  paper: {
                    sx: {
                      backgroundColor: "#21598b",
                      color: "#fff",
                    },
                  },
                }}
                renderOption={(props, option, { selected }) => {
                  const { key, ...otherProps } = props; // key'i ayrı al, diğerlerini spread et
                  return (
                    <li
                      key={key}
                      {...otherProps}
                      style={{
                        backgroundColor: selected
                          ? "#418acb"
                          : props["aria-selected"] === "true"
                          ? "#276aad"
                          : "#21598b",
                        color: "#fff",
                        fontSize: 15,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#276aad";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = selected
                          ? "#418acb"
                          : "#21598b";
                      }}
                    >
                      {option.name}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Kategori"
                    size="small"
                    sx={{
                      input: { color: "#fff", fontSize: 15 },
                      label: { color: "#fff", fontSize: 15 },
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#418acb" },
                        "&:hover fieldset": { borderColor: "#fff" },
                        "&.Mui-focused fieldset": { borderColor: "#418acb" },
                        backgroundColor: "rgba(89,146,203,0.12)",
                        borderRadius: 1.5,
                        minHeight: 36,
                      },
                    }}
                  />
                )}
              />
            </div>

            {/* Marka */}
            <div style={{ minWidth: 170, maxWidth: 210 }}>
              <Autocomplete
                multiple
                size="small"
                options={brands
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))}
                getOptionLabel={(option) => option.name}
                value={selectedBrands}
                onChange={(event, value) => setSelectedBrands(value)}
                isOptionEqualToValue={(opt, val) => opt.brandId === val.brandId}
                disableCloseOnSelect
                renderTags={() => null}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: 15,
                    backgroundColor: "rgba(89,146,203,0.12)",
                    borderRadius: 1.5,
                    p: "2px 6px",
                    height: 36,
                    minHeight: 36,
                  },
                  minWidth: 170,
                  maxWidth: 210,
                }}
                slotProps={{
                  paper: {
                    sx: {
                      backgroundColor: "#21598b",
                      color: "#fff",
                    },
                  },
                }}
                renderOption={(props, option, { selected }) => {
                  const { key, ...otherProps } = props; // key'i ayır
                  return (
                    <li
                      key={key} // key'i ayrı ver
                      {...otherProps} // diğer props'ları yay
                      style={{
                        backgroundColor: selected
                          ? "#418acb"
                          : props["aria-selected"] === "true"
                          ? "#276aad"
                          : "#21598b",
                        color: "#fff",
                        fontSize: 15,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#276aad";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = selected
                          ? "#418acb"
                          : "#21598b";
                      }}
                    >
                      {option.name}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Marka"
                    size="small"
                    sx={{
                      input: { color: "#fff", fontSize: 15 },
                      label: { color: "#fff", fontSize: 15 },
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#418acb" },
                        "&:hover fieldset": { borderColor: "#fff" },
                        "&.Mui-focused fieldset": { borderColor: "#418acb" },
                        backgroundColor: "rgba(89,146,203,0.12)",
                        borderRadius: 1.5,
                        minHeight: 36,
                      },
                    }}
                  />
                )}
              />
            </div>

            {/* Filtre */}
            <div style={{ minWidth: 170, maxWidth: 210 }}>
              <Autocomplete
                options={[
                  { value: "all", name: "Tüm Ürünler" },
                  { value: "critical", name: "Kritik Stoktaki Ürünler" },
                  { value: "outofstock", name: "Stokta Olmayan Ürünler" },
                ]}
                getOptionLabel={(option) => option.name}
                value={
                  productFilters.find((opt) => opt.value === filterType) || null
                }
                onChange={(event, value) => {
                  if (value) setFilterType(value.value);
                }}
                isOptionEqualToValue={(opt, val) => opt.value === val.value}
                disableClearable
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: 15,
                    backgroundColor: "rgba(89,146,203,0.12)",
                    borderRadius: 1.5,
                    p: "2px 6px",
                    height: 36,
                    minHeight: 36,
                  },
                  minWidth: 170,
                  maxWidth: 210,
                }}
                slotProps={{
                  paper: {
                    sx: {
                      backgroundColor: "#21598b",
                      color: "#fff",
                    },
                  },
                }}
                renderOption={(props, option, { selected }) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li
                      key={key ?? option.value}
                      {...otherProps}
                      style={{
                        backgroundColor: selected
                          ? "#418acb"
                          : props["aria-selected"] === "true"
                          ? "#276aad"
                          : "#21598b",
                        color: "#fff",
                        fontSize: 15,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#276aad";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = selected
                          ? "#418acb"
                          : "#21598b";
                      }}
                    >
                      {option.name}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Ürünleri Filtrele"
                    size="small"
                    sx={{
                      input: { color: "#fff", fontSize: 15 },
                      label: { color: "#fff", fontSize: 15 },
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#418acb" },
                        "&:hover fieldset": { borderColor: "#fff" },
                        "&.Mui-focused fieldset": { borderColor: "#418acb" },
                        backgroundColor: "rgba(89,146,203,0.12)",
                        borderRadius: 1.5,
                        minHeight: 36,
                      },
                    }}
                  />
                )}
              />
            </div>

            {/* Sıralama */}
            <div style={{ minWidth: 170, maxWidth: 210 }}>
              <Autocomplete
                options={[
                  { value: "serialnumber_asc", name: "Sıra No (Artan)" },
                  { value: "serialnumber_desc", name: "Sıra No (Azalan)" },
                  { value: "name_asc", name: "Ürün Adı (A-Z)" },
                  { value: "name_desc", name: "Ürün Adı (Z-A)" },
                  { value: "quantity_asc", name: "Stok (Artan)" },
                  { value: "quantity_desc", name: "Stok (Azalan)" },
                  { value: "category_asc", name: "Kategori (A-Z)" },
                  { value: "category_desc", name: "Kategori (Z-A)" },
                  { value: "brand_asc", name: "Marka (A-Z)" },
                  { value: "brand_desc", name: "Marka (Z-A)" },
                  { value: "createdAt_desc", name: "Eklenme Tarihi (Azalan)" },
                  { value: "createdAt_asc", name: "Eklenme Tarihi (Artan)" },
                ]}
                getOptionLabel={(option) => option.name}
                value={
                  sortOptionsList.find((opt) => opt.value === sortOption) ||
                  null
                }
                onChange={(event, value) => {
                  if (value) setSortOption(value.value);
                }}
                isOptionEqualToValue={(opt, val) => opt.value === val.value}
                disableClearable
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: 15,
                    backgroundColor: "rgba(89,146,203,0.12)",
                    borderRadius: 1.5,
                    p: "2px 6px",
                    height: 36,
                    minHeight: 36,
                  },
                  minWidth: 170,
                  maxWidth: 210,
                }}
                slotProps={{
                  paper: {
                    sx: {
                      backgroundColor: "#21598b",
                      color: "#fff",
                    },
                  },
                }}
                renderOption={(props, option, { selected }) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li
                      key={key ?? option.value} // key ekledik, yoksa option.value kullanılır
                      {...otherProps}
                      style={{
                        backgroundColor: selected
                          ? "#418acb"
                          : props["aria-selected"] === "true"
                          ? "#276aad"
                          : "#21598b",
                        color: "#fff",
                        fontSize: 15,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#276aad";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = selected
                          ? "#418acb"
                          : "#21598b";
                      }}
                    >
                      {option.name}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Sıralama"
                    size="small"
                    sx={{
                      input: { color: "#fff", fontSize: 15 },
                      label: { color: "#fff", fontSize: 15 },
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#418acb" },
                        "&:hover fieldset": { borderColor: "#fff" },
                        "&.Mui-focused fieldset": { borderColor: "#418acb" },
                        backgroundColor: "rgba(89,146,203,0.12)",
                        borderRadius: 1.5,
                        minHeight: 36,
                      },
                    }}
                  />
                )}
              />
            </div>

            {/* Arama */}
            <TextField
              label="Ürün Ara"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                input: { color: "#fff" },
                label: { color: "#fff" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#ccc" },
                  "&:hover fieldset": { borderColor: "#fff" },
                  "&.Mui-focused fieldset": { borderColor: "#418acb" },
                },
              }}
            />

            {/* Kritik Seviye */}
            <Box display="flex" alignItems="center" gap={1}>
              <Typography color="#fff" fontWeight={500}>
                Kritik Stok Seviyesi:
              </Typography>
              <TextField
                type="number"
                size="small"
                value={criticalLevel}
                onChange={async (e) => {
                  const value = Number(e.target.value);
                  setCriticalLevel(value);
                  try {
                    await axios.put(
                      `http://localhost:5184/api/Product/UpdateAllCriticalStockLevel/${value}`
                    );
                  } catch (err) {
                    console.error("Kritik stok seviyesi güncellenemedi:", err);
                  }
                }}
                sx={{
                  width: 70,
                  input: { color: "#fff", textAlign: "center" },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc" },
                    "&:hover fieldset": { borderColor: "#fff" },
                    "&.Mui-focused fieldset": { borderColor: "#418acb" },
                  },
                }}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              width: "100%",
              maxWidth: "100vw",
              height: { xs: 420, sm: 520, md: 620, lg: 525, xl: 733 },
              overflow: "auto",
              background: "rgba(16,132,199,0.07)",
              borderRadius: 2,
              boxShadow: 2,
              p: 0,
            }}
          >
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 20, 50, 100]}
              getRowClassName={getRowClassName}
              autoHeight={false}
              sx={{
                width: "100%",
                height: "100%",
                border: 0,
                backgroundColor: "transparent",
                color: "#fff",
                fontSize: 16,
                "& .critical-row": criticalRowClass,
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#21598b",
                },
                "& .MuiDataGrid-columnHeader": {
                  backgroundColor: "#6baee8ff",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 18,
                  borderRight: "1px solid #4da7db33",
                },
                "& .MuiDataGrid-cell": {
                  color: "#fff",
                  fontWeight: "bold",
                },
                "& .MuiDataGrid-row:not(.critical-row):hover": {
                  backgroundColor: "rgba(32, 158, 255, 0) !important",
                },
                "& .Mui-selected, & .Mui-selected:hover": {
                  backgroundColor: "#1d5fae !important",
                  color: "#fff",
                },
                "& .MuiTablePagination-root, & .MuiTablePagination-toolbar": {
                  color: "#fff",
                },
              }}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ProductList;
