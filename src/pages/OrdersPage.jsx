import { useEffect, useState } from "react";
import { Alert, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import socket from "../services/socket";
import { inr } from "../utils/currency";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const successMessage = location.state?.message || "";

  const getOrderLabel = (order) => {
    const itemNames = (order.items || [])
      .map((item) => item.name)
      .filter(Boolean);

    if (!itemNames.length) {
      return "Order";
    }

    if (itemNames.length === 1) {
      return itemNames[0];
    }

    return `${itemNames[0]} + ${itemNames.length - 1} more`;
  };

  const getOrderSizeLabel = (order) => {
    const sizes = (order.items || [])
      .map((item) => item.size)
      .filter(Boolean);

    if (!sizes.length) return "";
    return ` | Sizes: ${[...new Set(sizes)].join(", ")}`;
  };

  useEffect(() => {
    const loadOrders = () => {
      api
        .get("/orders")
        .then(({ data }) => setOrders(data.orders))
        .catch((e) => setError(e.response?.data?.message || "Failed to load orders"));
    };

    loadOrders();
    socket.on("purchase:new", loadOrders);

    return () => {
      socket.off("purchase:new", loadOrders);
    };
  }, []);

  return (
    <Container sx={{ py: { xs: 2, md: 3 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, fontSize: { xs: 28, sm: 34 } }}>Order History</Typography>
      {successMessage ? <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {!orders.length ? <Alert severity="info">No orders yet.</Alert> : null}
      <Stack spacing={2}>
        {orders.map((order) => (
          <Card
            key={order.id}
            onClick={() => navigate(`/orders/${order.id}`, { state: { order } })}
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper,
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: theme.palette.mode === "dark" ? "0 12px 26px rgba(0,0,0,0.32)" : "0 12px 26px rgba(15,23,42,0.08)"
              }
            }}
          >
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 1, gap: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>{getOrderLabel(order)}</Typography>
                <Chip
                  label={inr(order.total)}
                  size="small"
                  sx={{
                    bgcolor: theme.palette.text.primary,
                    color: theme.palette.background.default
                  }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">Order #{order.id}</Typography>
              <Typography variant="body2" color="text.secondary">Placed on {new Date(order.createdAt).toLocaleString()}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Items: {order.items?.length || 0}{getOrderSizeLabel(order)}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}


