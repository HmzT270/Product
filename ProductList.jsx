import React, { useEffect, useState } from "react";
import { getAllCategories } from "../services/categoryService";
import { getAllBrands } from "../services/brandService";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Autocomplete,
  InputAdornment,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Alert,
  Fade,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import myFont from "../fonts/OpenSansLight.js";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

const criticalRowClass = {
  backgroundColor: "error.light",
  color: "text.primary",
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
    { value: "favorites", name: "Favori Ürünler" },
  ];

  const sortOptionsList = [
    { value: "serialnumber_asc", name: "Sıra No (Artan)" },
    { value: "serialnumber_desc", name: "Sıra No (Azalan)" },
    { value: "name_asc", name: "Ad (A-Z)" },
    { value: "name_desc", name: "Ad (Z-A)" },
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
  const [showFavoritesIcon, setShowFavoritesIcon] = useState(false); // ⭐ Yıldız gösterimi
  const [favoriteStatus, setFavoriteStatus] = useState({
    success: null,
    message: "",
  });
  const [showFavoriteStatus, setShowFavoriteStatus] = useState(false);

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

const loadSortedProducts = async (userId) => {
  const [orderBy, direction] = sortOption.split("_");
  try {
    const res = await axios.get(
      `http://localhost:5184/api/Product/Sorted?orderBy=${orderBy}&direction=${direction}&userId=${userId}`
    );
    setProducts(res.data); // ⭐ Favoriler backend'ten gelen isFavorite ile geliyor
  } catch (err) {
    console.error("Sıralı ürünler yüklenemedi:", err);
  }
};


  const currentUserId = localStorage.getItem("userId");

useEffect(() => {
  if (currentUserId) {
    loadSortedProducts(currentUserId); // ⭐ her mount olduğunda userId ile yükle
  }
}, [sortOption, currentUserId]);
// 🔹 Giriş yapan kullanıcının ID'si, gerçekte token veya contextten gelecek

const toggleFavorite = async (id) => {
  try {
    // 1️⃣ UI'da anlık güncelle (optimistic update)
    setProducts((prev) =>
      prev.map((p) =>
        p.productId === id ? { ...p, isFavorite: !p.isFavorite } : p
      )
    );

    // 2️⃣ Backend'e kullanıcı ID ile isteği at
    const res = await axios.put(
      `http://localhost:5184/api/Product/ToggleFavorite/${id}?userId=${currentUserId}`
    );

    // 3️⃣ Backend yanıtına göre uyarı mesajı
    const isFav = res.data.isFavorite;
    setFavoriteStatus({
      success: true,
      message: isFav
        ? "Ürün favorilere eklendi ⭐"
        : "Ürün favorilerden çıkarıldı ❌",
    });
    setShowFavoriteStatus(true);

    // 4️⃣ Uyarı mesajı 1.5 saniye görünür, 3 saniyede kaybolur
    setTimeout(() => setShowFavoriteStatus(false), 1500);
    setTimeout(() => setFavoriteStatus({ success: null, message: "" }), 3000);

    // 5️⃣ Backend'ten güncel favori durumunu çek
    loadSortedProducts(currentUserId);
  } catch (error) {
    console.error("Favori durumu değiştirilemedi", error);

    // ❌ Hata durumunda uyarı mesajı
    setFavoriteStatus({
      success: false,
      message: "Favori işlemi başarısız!",
    });
    setShowFavoriteStatus(true);
    setTimeout(() => setShowFavoriteStatus(false), 1500);
    setTimeout(() => setFavoriteStatus({ success: null, message: "" }), 3000);
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
          : filterType === "outofstock"
          ? row.quantity === 0
          : filterType === "favorites"
          ? row.isFavorite // ⭐ Favori ürünler
          : true;

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
        <Box sx={{ color: "text.primary", fontWeight: "bold" }}>
          {params.value}
        </Box>
      ),
    },
    {
      field: "productId",
      headerName: "ID",
      flex: 1,
      minWidth: 90,
      renderCell: (params) => (
        <Box sx={{ color: "text.primary", fontWeight: "bold" }}>
          {params.value}
        </Box>
      ),
    },
    {
      field: "name",
      headerName: "Ad",
      flex: 2,
      minWidth: 130,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "text.primary",
            fontWeight: "bold",
          }}
        >
          {params.value}
          {showFavoritesIcon && (
            <IconButton
              size="small"
              onClick={() => toggleFavorite(params.row.productId)}
            >
              {params.row.isFavorite ? (
                <StarIcon style={{ color: "gold", fontSize: 20 }} />
              ) : (
                <StarBorderIcon style={{ fontSize: 20 }} />
              )}
            </IconButton>
          )}
        </Box>
      ),
    },

    {
      field: "description",
      headerName: "Açıklama",
      flex: 2,
      minWidth: 130,
      renderCell: (params) => (
        <Box sx={{ color: "text.primary", fontWeight: "bold" }}>
          {params.value || <i>Yok</i>}
        </Box>
      ),
    },
    {
      field: "quantity",
      headerName: "Stok",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Box sx={{ color: "text.primary", fontWeight: "bold" }}>
          {params.value}
          {params.row.quantity <= criticalLevel && filterType === "all" && (
            <span style={{ marginLeft: "8px", fontSize: 18 }}>⚠</span>
          )}
        </Box>
      ),
    },
    {
      field: "category",
      headerName: "Kategori",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Box sx={{ color: "text.primary", fontWeight: "bold" }}>
          {params.value}
        </Box>
      ),
    },
    {
      field: "brand",
      headerName: "Marka",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Box sx={{ color: "text.primary", fontWeight: "bold" }}>
          {params.value || <i>Yok</i>}
        </Box>
      ),
    },
    {
      field: "createdBy",
      headerName: "Ekleyen",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Box sx={{ color: "text.primary", fontWeight: "bold" }}>
          {params.value || <i>Bilinmiyor</i>}
        </Box>
      ),
    },
    {
      field: "createdAt",
      headerName: "Eklenme Tarihi",
      flex: 2,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ color: "text.primary", fontWeight: "bold" }}>
          {new Date(params.value).toLocaleString("tr-TR")}
        </Box>
      ),
    },
  ];

  // Excel Export
  const exportToExcel = (data) => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((p) => ({
        ID: p.productId,
        Ad: p.name,
        Marka: p.brand || "Yok",
        Kategori: p.category || "Yok",
        Stok: p.quantity,
        "Eklenme Tarihi": new Date(p.createdAt).toLocaleDateString(),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ürünler");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `urunler_${Date.now()}.xlsx`);
  };

  // PDF Export (Türkçe karakter destekli)
  const exportToPDF = (data) => {
    const doc = new jsPDF();

    // Özel fontu ekle ve kullan
    doc.addFileToVFS("OpenSans-Light.ttf", myFont);
    doc.addFont("OpenSans-Light.ttf", "OpenSans", "normal");
    doc.setFont("OpenSans");

    doc.text("Ürün Dökümü", 14, 10);

    const tableColumn = ["ID", "Ad", "Marka", "Kategori", "Stok", "Eklenme"];
    const tableRows = data.map((p) => [
      p.productId,
      p.name,
      p.brand || "Yok",
      p.category || "Yok",
      p.quantity,
      new Date(p.createdAt).toLocaleDateString("tr-TR"), // Türkçe tarih formatı
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { font: "OpenSans" }, // Tablo için font
    });

    doc.save(`urunler_${Date.now()}.pdf`);
  };

  return (
    <Box
      sx={{ width: "100%", maxWidth: "100vw", minHeight: "92vh", m: 0, p: 0 }}
    >
      <style>{criticalRowStyle}</style>

      <Grid container spacing={0} sx={{ width: "100%", m: 0, p: 0 }}>
        <Grid sx={{ width: "100%", mt: 2 }}>
          <Typography
            variant="h5"
            gutterBottom
            color="text.primary"
            fontWeight={700}
          >
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
                      backgroundColor: "background.paper",
                      color: "text.primary",
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
                        color: "text.primary",
                        fontSize: 15,
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
                      input: { color: "text.primary", fontSize: 15 },
                      label: { color: "text.primary", fontSize: 15 },
                      "& .MuiOutlinedInput-root": {
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
                      backgroundColor: "background.paper",
                      color: "text.primary",
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
                        fontSize: 15,
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
                      input: { color: "text.primary", fontSize: 15 },
                      label: { color: "text.primary", fontSize: 15 },
                      "& .MuiOutlinedInput-root": {
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
                options={productFilters} // ⭐ Sabit diziyi kaldırdık
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
                      backgroundColor: "background.paper",
                      color: "text.primary",
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
                        color: "text.primary",
                        fontSize: 15,
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
                      input: { color: "text.primary", fontSize: 15 },
                      label: { color: "text.primary", fontSize: 15 },
                      "& .MuiOutlinedInput-root": {
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
                  { value: "name_asc", name: "Ad (A-Z)" },
                  { value: "name_desc", name: "Ad (Z-A)" },
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
                      backgroundColor: "background.paper",
                      color: "text.primary",
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
                        color: "text.primary",
                        fontSize: 15,
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
                      input: { color: "text.primary", fontSize: 15 },
                      label: { color: "text.primary", fontSize: 15 },
                      "& .MuiOutlinedInput-root": {
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
                width: 150,
                input: { color: "text.primary" },
                label: { color: "text.primary" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#ccc" },
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Kritik Seviye */}
            <Box display="flex" alignItems="center" gap={1}>
              <Typography color="text.primary" fontWeight={500}>
                Kritik Stok:
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
                  input: { color: "text.primary", textAlign: "center" },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc" },
                  },
                }}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={showFavoritesIcon}
                  onChange={(e) => setShowFavoritesIcon(e.target.checked)}
                />
              }
              label="Yıldızları Göster"
            />
          </Box>

          <Box
            sx={{
              width: "100%",
              maxWidth: "100vw",
              height: { xs: 420, sm: 520, md: 620, lg: 525, xl: 733 },
              overflow: "auto",
              backgroundColor: "background.default",
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
              localeText={{
                noRowsLabel: "Ürün Bulunamadı",
              }}
              sx={{
                width: "100%",
                height: "100%",
                border: 0,
                backgroundColor: "transparent",
                color: "text.primary",
                fontSize: 16,
                "& .critical-row": criticalRowClass,
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "background.paper",
                },
                "& .MuiDataGrid-columnHeader, .MuiDataGrid-footerContainer": {
                  backgroundColor: "background.paper",
                  color: "text.primary",
                  fontWeight: "bold",
                  fontSize: 18,
                  borderRight: "1px solid #4da7db33",
                },
                "& .MuiDataGrid-cell": {
                  color: "text.primary",
                  fontWeight: "bold",
                },
                "& .MuiTablePagination-root, & .MuiTablePagination-toolbar": {
                  color: "text.primary",
                },
              }}
            />
          </Box>

          {/* Export Butonları (Tablo Altında) */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between", // Butonlar solda, uyarı sağda
              alignItems: "center", // Dikey hizalama
              gap: 2,
              mt: 2,
            }}
          >
            {/* Sol tarafta butonlar */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => exportToExcel(rows)}
              >
                Excel İndir
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => exportToPDF(rows)}
              >
                PDF İndir
              </Button>
            </Box>

            {/* Sağ tarafta Favori Uyarı Mesajı */}
            <Fade in={showFavoriteStatus} timeout={1500}>
              <Alert
                severity={favoriteStatus.success ? "success" : "error"}
                sx={{
                  maxWidth: 300,
                  height: 36, // Buton yüksekliğiyle aynı
                  display: "flex",
                  alignItems: "center",
                  mb: 0, // Alt boşluk olmasın
                }}
              >
                {favoriteStatus.message}
              </Alert>
            </Fade>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ProductList;
