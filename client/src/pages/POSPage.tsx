import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  List,
  InputNumber,
  Select,
  Divider,
  Modal,
  Radio,
  Typography,
  Space,
  message,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { productService } from '@/services/product.service';
import { invoiceService } from '@/services/invoice.service';
import { customerService } from '@/services/customer.service';
import type { Product, Customer, PaymentMethod } from '@/types';

const { Title, Text } = Typography;

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');

  // Discount
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('fixed');
  const [discountValue, setDiscountValue] = useState(0);

  // Checkout modal
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await productService.getAll({ limit: 500, is_active: true });
      setProducts(res.data);
      setFilteredProducts(res.data);
    } catch {
      message.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredProducts(products);
    } else {
      const lower = searchText.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(lower) ||
            p.sku.toLowerCase().includes(lower) ||
            p.barcode?.toLowerCase().includes(lower),
        ),
      );
    }
  }, [searchText, products]);

  const fetchCustomers = useCallback(async (search: string) => {
    if (!search.trim()) return;
    try {
      const data = await customerService.search(search);
      setCustomers(data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch) fetchCustomers(customerSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [customerSearch, fetchCustomers]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i)),
      );
    }
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.selling_price * item.quantity,
    0,
  );
  const discountAmount =
    discountType === 'percent'
      ? Math.round(subtotal * (discountValue / 100))
      : discountValue;
  const total = Math.max(0, subtotal - discountAmount);

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      message.warning('Giỏ hàng trống');
      return;
    }
    try {
      setSubmitting(true);
      const invoice = await invoiceService.create({
        customer_id: customerId,
        type: 'sale',
        subtotal,
        discount_amount: discountAmount,
        tax_amount: 0,
        total_amount: total,
        status: 'pending',
        items: cart.map((item) => ({
          item_type: 'product' as const,
          product_id: item.product.id,
          description: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.selling_price,
          discount: 0,
          line_total: item.product.selling_price * item.quantity,
        })) as any,
      });

      await invoiceService.addPayment(invoice.id, {
        amount: total,
        method: paymentMethod,
        reference_no: referenceNo || undefined,
        paid_at: new Date().toISOString(),
      });

      message.success(`Thanh toán thành công - HĐ: ${invoice.invoice_number}`);
      setCart([]);
      setDiscountValue(0);
      setCustomerId(undefined);
      setCheckoutOpen(false);
      setReferenceNo('');
    } catch {
      message.error('Thanh toán thất bại, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const paymentMethodOptions: { label: string; value: PaymentMethod }[] = [
    { label: 'Tiền mặt', value: 'cash' },
    { label: 'Thẻ', value: 'card' },
    { label: 'Chuyển khoản', value: 'transfer' },
    { label: 'MoMo', value: 'momo' },
    { label: 'ZaloPay', value: 'zalopay' },
    { label: 'VNPay', value: 'vnpay' },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        Bán hàng (POS)
      </Title>

      <Row gutter={16}>
        {/* Left: Product grid */}
        <Col span={14}>
          <Card
            title="Sản phẩm"
            extra={
              <Input.Search
                placeholder="Tìm sản phẩm..."
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 280 }}
              />
            }
            bodyStyle={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}
          >
            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>
            ) : filteredProducts.length === 0 ? (
              <Empty description="Không tìm thấy sản phẩm" />
            ) : (
              <Row gutter={[12, 12]}>
                {filteredProducts.map((product) => (
                  <Col key={product.id} xs={12} sm={8} md={6}>
                    <Card
                      hoverable
                      size="small"
                      onClick={() => addToCart(product)}
                      style={{ textAlign: 'center' }}
                      cover={
                        <div
                          style={{
                            height: 80,
                            background: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#bbb',
                            fontSize: 12,
                          }}
                        >
                          {product.photo_url ? (
                            <img
                              src={product.photo_url}
                              alt={product.name}
                              style={{
                                maxHeight: 80,
                                maxWidth: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <ShoppingCartOutlined style={{ fontSize: 28 }} />
                          )}
                        </div>
                      }
                    >
                      <Text
                        strong
                        ellipsis
                        style={{ fontSize: 13, display: 'block' }}
                      >
                        {product.name}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatVND(product.selling_price)}
                      </Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>

        {/* Right: Cart */}
        <Col span={10}>
          <Card
            title="Giỏ hàng"
            bodyStyle={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}
          >
            {/* Customer select */}
            <Select
              showSearch
              allowClear
              placeholder="Chọn khách hàng"
              value={customerId}
              onChange={(v) => setCustomerId(v)}
              onSearch={(v) => setCustomerSearch(v)}
              filterOption={false}
              style={{ width: '100%', marginBottom: 12 }}
              options={customers.map((c) => ({
                label: `${c.full_name} - ${c.phone}`,
                value: c.id,
              }))}
            />

            {cart.length === 0 ? (
              <Empty description="Chưa có sản phẩm" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={cart}
                renderItem={(item) => (
                  <List.Item
                    extra={
                      <Text strong>{formatVND(item.product.selling_price * item.quantity)}</Text>
                    }
                  >
                    <List.Item.Meta
                      title={
                        <Text ellipsis style={{ maxWidth: 160 }}>
                          {item.product.name}
                        </Text>
                      }
                      description={
                        <Space size={4}>
                          <Button
                            size="small"
                            icon={<MinusOutlined />}
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                          />
                          <InputNumber
                            size="small"
                            min={1}
                            value={item.quantity}
                            onChange={(v) =>
                              updateQuantity(item.product.id, v ?? 1)
                            }
                            style={{ width: 55 }}
                          />
                          <Button
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                          />
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeFromCart(item.product.id)}
                          />
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            x {formatVND(item.product.selling_price)}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}

            <Divider style={{ margin: '12px 0' }} />

            {/* Discount */}
            <div style={{ marginBottom: 8 }}>
              <Text>Giảm giá:</Text>
              <Space style={{ float: 'right' }}>
                <Select
                  size="small"
                  value={discountType}
                  onChange={(v) => setDiscountType(v)}
                  style={{ width: 80 }}
                  options={[
                    { label: 'VND', value: 'fixed' },
                    { label: '%', value: 'percent' },
                  ]}
                />
                <InputNumber
                  size="small"
                  min={0}
                  max={discountType === 'percent' ? 100 : subtotal}
                  value={discountValue}
                  onChange={(v) => setDiscountValue(v ?? 0)}
                  style={{ width: 100 }}
                />
              </Space>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text>Tạm tính:</Text>
              <Text>{formatVND(subtotal)}</Text>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text>Giảm giá:</Text>
                <Text type="danger">-{formatVND(discountAmount)}</Text>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <Title level={5} style={{ margin: 0 }}>
                Tổng cộng:
              </Title>
              <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                {formatVND(total)}
              </Title>
            </div>

            <Button
              type="primary"
              size="large"
              block
              disabled={cart.length === 0}
              onClick={() => setCheckoutOpen(true)}
            >
              Thanh toán
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Checkout modal */}
      <Modal
        title="Xác nhận thanh toán"
        open={checkoutOpen}
        onCancel={() => setCheckoutOpen(false)}
        onOk={handleCheckout}
        confirmLoading={submitting}
        okText="Xác nhận"
        cancelText="Hủy"
        width={480}
      >
        <div style={{ marginBottom: 16 }}>
          <Title level={5}>
            Tổng thanh toán: {formatVND(total)}
          </Title>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Phương thức thanh toán:
          </Text>
          <Radio.Group
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            options={paymentMethodOptions}
          />
        </div>

        {paymentMethod !== 'cash' && (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Mã giao dịch:
            </Text>
            <Input
              placeholder="Nhập mã giao dịch / tham chiếu"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
