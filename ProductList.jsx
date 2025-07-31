import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Autocomplete,
  Alert,
  Grid,
  Fade,
} from "@mui/material";
import {
  getAllBrands,
  addBrand,
  deleteBrand,
  renameBrand,
} from "../services/brandService";
import axios from "axios";

const labelSx = {
  color: "text.primary",
  "&.Mui-focused": { color: "text.primary" },
  "&.MuiInputLabel-shrink": { color: "text.primary" },
};

export default function BrandEdit() {
  const [brands, setBrands] = useState([]);
  const [addName, setAddName] = useState("");
  const [deleteBrandValue, setDeleteBrandValue] = useState(null);
  const [renameBrandValue, setRenameBrandValue] = useState(null);
  const [newRename, setNewRename] = useState("");

  const [addStatus, setAddStatus] = useState({ success: null, message: "" });
  const [deleteStatus, setDeleteStatus] = useState({ success: null, message: "" });
  const [renameStatus, setRenameStatus] = useState({ success: null, message: "" });

  const [showAddStatus, setShowAddStatus] = useState(false);
  const [showDeleteStatus, setShowDeleteStatus] = useState(false);
  const [showRenameStatus, setShowRenameStatus] = useState(false);

  const showTemporaryMessage = (setStatus, setShowStatus, newStatus) => {
    setStatus(newStatus);
    setShowStatus(true);
    setTimeout(() => setShowStatus(false), 3000);
  };

  const refreshBrands = async () => {
    const data = await getAllBrands();
    setBrands(data);
  };

  useEffect(() => {
    refreshBrands();
  }, []);

  const handleAdd = async () => {
    if (!addName.trim()) {
      showTemporaryMessage(setAddStatus, setShowAddStatus, {
        success: false,
        message: "Marka adı girin.",
      });
      return;
    }
    try {
      await addBrand(addName.trim());
      showTemporaryMessage(setAddStatus, setShowAddStatus, {
        success: true,
        message: "Marka eklendi.",
      });
      setAddName("");
      refreshBrands();
    } catch {
      showTemporaryMessage(setAddStatus, setShowAddStatus, {
        success: false,
        message: "Marka eklenemedi.",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteBrandValue) {
      showTemporaryMessage(setDeleteStatus, setShowDeleteStatus, {
        success: false,
        message: "Silinecek markayı seçin.",
      });
      return;
    }

    try {
      // Önce markaya ait ürün var mı kontrol et
      const res = await axios.get(
        `http://localhost:5184/api/Product/Brand/${deleteBrandValue.brandId}`
      );

      if (res.data && res.data.length > 0) {
        // Ürün varsa özel uyarıyı göster ve çık
        setDeleteStatus({
          success: false,
          message: "Bu markaya ait ürünler bulunduğu için silinemez!",
        });
        setShowDeleteStatus(true);
        setTimeout(() => setShowDeleteStatus(false), 3000);
        return; // ❗ burada return ederek catch'e girmesini engelliyoruz
      }

      // Ürün yoksa sil
      await deleteBrand(deleteBrandValue.brandId);

      showTemporaryMessage(setDeleteStatus, setShowDeleteStatus, {
        success: true,
        message: "Marka silindi.",
      });
      setDeleteBrandValue(null);
      refreshBrands();
    } catch {
      showTemporaryMessage(setDeleteStatus, setShowDeleteStatus, {
        success: false,
        message: "Marka silinemedi",
      });
    }
  };

  const handleRename = async () => {
    if (!renameBrandValue || !newRename.trim()) {
      showTemporaryMessage(setRenameStatus, setShowRenameStatus, {
        success: false,
        message: "Marka ve yeni adı seçin.",
      });
      return;
    }
    try {
      await renameBrand(renameBrandValue.brandId, newRename.trim());
      showTemporaryMessage(setRenameStatus, setShowRenameStatus, {
        success: true,
        message: "Marka adı değiştirildi.",
      });
      setRenameBrandValue(null);
      setNewRename("");
      refreshBrands();
    } catch {
      showTemporaryMessage(setRenameStatus, setShowRenameStatus, {
        success: false,
        message: "Marka adı değiştirilemedi.",
      });
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "50vh",
        py: 10,
        px: { xs: 0, md: 4 },
        bgcolor: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Grid rowSpacing={3} container spacing={6} justifyContent="center">
        {/* Marka Ekle */}
        <Grid>
          <Paper
            sx={{
              width: 340,
              height: 203,
              p: 3,
              bgcolor: "background.default",
              color: "text.primary",
              borderRadius: 3,
              boxShadow: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Marka Ekle
            </Typography>
            <TextField
              label="Marka Adı"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              fullWidth
              InputLabelProps={{ sx: labelSx }}
              inputProps={{ style: { color: "text.primary" } }}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={handleAdd}
              fullWidth
              sx={{
                backgroundColor: "rgba(68, 129, 160, 0.5)",
                color: "#fff",
                "&:hover": { backgroundColor: "rgba(18, 93, 131, 0.5)" },
              }}
            >
              Ekle
            </Button>
          </Paper>
          <Grid sx={{ mt: 2, height: 40 }}>
            <Fade in={showAddStatus} timeout={1500}>
              <Box sx={{ width: "100%" }}>
                {addStatus.message && (
                  <Alert severity={addStatus.success ? "success" : "error"}>
                    {addStatus.message}
                  </Alert>
                )}
              </Box>
            </Fade>
          </Grid>
        </Grid>

        {/* Marka Sil */}
        <Grid>
          <Paper
            sx={{
              width: 340,
              minHeight: 150,
              p: 3,
              bgcolor: "background.default",
              color: "text.primary",
              borderRadius: 3,
              boxShadow: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Marka Sil
            </Typography>
            <Autocomplete
              options={brands}
              getOptionLabel={(option) => option.name}
              value={deleteBrandValue}
              onChange={(e, val) => setDeleteBrandValue(val)}
              componentsProps={{
                paper: { sx: { bgcolor: "background.paper", color: "text.primary" } },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Marka Seç"
                  fullWidth
                  InputLabelProps={{ sx: labelSx }}
                  inputProps={{
                    ...params.inputProps,
                    style: { color: "text.primary" },
                  }}
                  sx={{ mb: 2 }}
                />
              )}
            />
            <Button
              variant="contained"
              onClick={handleDelete}
              fullWidth
              sx={{
                backgroundColor: "rgba(199,36,36,0.5)",
                color: "#fff",
                "&:hover": { backgroundColor: "rgba(255,59,59,0.6)" },
              }}
            >
              Sil
            </Button>
          </Paper>
          <Grid sx={{ mt: 2, height: 40 }}>
            <Fade in={showDeleteStatus} timeout={1500}>
              <Box sx={{ width: "100%" }}>
                {deleteStatus.message && (
                  <Alert severity={deleteStatus.success ? "success" : "error"}>
                    {deleteStatus.message}
                  </Alert>
                )}
              </Box>
            </Fade>
          </Grid>
        </Grid>

        {/* Marka Adı Değiştir */}
        <Grid>
          <Paper
            sx={{
              width: 340,
              height: 270,
              p: 3,
              bgcolor: "background.default",
              color: "text.primary",
              borderRadius: 3,
              boxShadow: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Marka Adı Değiştir
            </Typography>
            <Autocomplete
              options={brands}
              getOptionLabel={(option) => option.name}
              value={renameBrandValue}
              onChange={(e, val) => setRenameBrandValue(val)}
              componentsProps={{
                paper: { sx: { bgcolor: "background.paper", color: "text.primary" } },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Marka Seç"
                  fullWidth
                  InputLabelProps={{ sx: labelSx }}
                  inputProps={{
                    ...params.inputProps,
                    style: { color: "text.primary" },
                  }}
                  sx={{ mb: 2 }}
                />
              )}
            />
            <TextField
              label="Yeni Ad"
              value={newRename}
              onChange={(e) => setNewRename(e.target.value)}
              fullWidth
              InputLabelProps={{ sx: labelSx }}
              inputProps={{ style: { color: "text.primary" } }}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={handleRename}
              fullWidth
              sx={{
                backgroundColor: "rgba(68, 129, 160, 0.5)",
                color: "#fff",
                "&:hover": { backgroundColor: "rgba(18, 93, 131, 0.5)" },
              }}
            >
              Değiştir
            </Button>
          </Paper>
          <Grid sx={{ mt: 2, height: 40 }}>
            <Fade in={showRenameStatus} timeout={1500}>
              <Box sx={{ width: "100%" }}>
                {renameStatus.message && (
                  <Alert severity={renameStatus.success ? "success" : "error"}>
                    {renameStatus.message}
                  </Alert>
                )}
              </Box>
            </Fade>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
