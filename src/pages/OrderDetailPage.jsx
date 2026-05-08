import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Card, CardContent, Chip, Container, Divider, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useParams } from "react-router-dom";
import api from "../services/api";
import { inr } from "../utils/currency";

export default function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [error, setError] = useState("");
  const theme = useTheme();

  useEffect(() => {
    if (order?.id === id) return;

    api
      .get("/orders")
      .then(({ data }) => {
        const found = (data.orders || []).find((item) => item.id === id);
        if (found) {
          setOrder(found);
        } else {
          setError("Order not found");
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load order");
      });
  }, [id, order?.id]);

  const summary = useMemo(() => {
    if (!order?.items?.length) return "Order details";
    if (order.items.length === 1) return order.items[0].name;
    return `${order.items[0].name} + ${order.items.length - 1} more`;
  }, [order]);

  if (error) {
    return (
      <Container sx={{ py: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container sx={{ py: 3 }}>
        <Alert severity="info">Loading order details...</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: { xs: 2, md: 3 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, fontSize: { xs: 28, sm: 34 } }}>
        Order Details
      </Typography>

      <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 1, gap: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 24 } }}>{summary}</Typography>
              <Typography variant="body2" color="text.secondary">Order #{order.id}</Typography>
            </Box>
            <Chip
              label={inr(order.total)}
              sx={{
                bgcolor: theme.palette.text.primary,
                color: theme.palette.background.default
              }}
            />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customer: {order.userName} | {order.userEmail}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography sx={{ fontWeight: 800, mb: 1 }}>Items</Typography>
          <Stack spacing={1.2}>
            {order.items.map((item) => (
              <Box key={`${item.productId}-${item.name}`} sx={{ p: 1.5, borderRadius: 2, bgcolor: theme.palette.action.hover, border: `1px solid ${theme.palette.divider}` }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Size: {item.size || "M"} | Qty: {item.quantity} | Unit: {inr(item.unitPrice)}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800 }}>{inr(item.lineTotal)}</Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
