import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, IconButton, Paper, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import api from "../services/api";
import socket from "../services/socket";
import { inr } from "../utils/currency";

export default function CartPage() {
  const theme = useTheme();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadCart = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/cart");
      setCart(data.cart);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    const onPurchase = () => loadCart();
    const onFlashChange = () => loadCart();
    socket.on("purchase:new", onPurchase);
    socket.on("flashSale:created", onFlashChange);
    socket.on("flashSale:started", onFlashChange);
    socket.on("flashSale:expired", onFlashChange);

    return () => {
      socket.off("purchase:new", onPurchase);
      socket.off("flashSale:created", onFlashChange);
      socket.off("flashSale:started", onFlashChange);
      socket.off("flashSale:expired", onFlashChange);
    };
  }, []);

  const removeItem = async (productId, size) => {
    try {
      await api.post("/cart", { productId, action: "remove", size });
      loadCart();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to remove item");
    }
  };

  const changeQuantity = async (productId, quantity, action = "set", size) => {
    try {
      await api.post("/cart", { productId, quantity, action, size });
      loadCart();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update quantity");
    }
  };

  const checkout = async () => {
    try {
      await api.post("/orders");
      setMessage("Order placed successfully");
      loadCart();
    } catch (error) {
      setMessage(error.response?.data?.message || "Checkout failed");
    }
  };

  if (loading) {
    return <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}><CircularProgress /></Box>;
  }

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>My Cart</Typography>
      {!cart?.items?.length ? <Alert severity="info">Your cart is empty.</Alert> : null}
      <Stack spacing={2}>
        {cart?.items?.map((item) => (
          <Card key={item.productId} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
            <CardContent sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 700 }}>{item.product.name}</Typography>
                <Typography color="text.secondary">Brand: {item.product.brand || "Generic"}</Typography>
                <Typography color="text.secondary">Size: {item.size || item.product.sizes?.[0] || "M"}</Typography>
                <Typography sx={{ mt: 0.5 }}>Unit: {inr(item.unitPrice)} | Line Total: {inr(item.totalPrice)}</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                  <IconButton size="small" onClick={() => changeQuantity(item.productId, 1, "decrement", item.size)}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography>{item.quantity}</Typography>
                  <IconButton size="small" onClick={() => changeQuantity(item.productId, 1, "add", item.size)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Button color="error" onClick={() => removeItem(item.productId, item.size)} sx={{ alignSelf: { xs: "flex-end", sm: "auto" } }}>Remove</Button>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Paper sx={{ mt: 3, p: 2.5, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Order Summary</Typography>
        <Typography sx={{ mt: 0.5 }}>Total: {inr(cart?.total || 0)}</Typography>
        <Button disabled={!cart?.items?.length} sx={{ mt: 2 }} variant="contained" onClick={checkout}>Place Order</Button>
      </Paper>

      {message ? <Alert sx={{ mt: 2 }} severity="info">{message}</Alert> : null}
    </Container>
  );
}


