import { StatsCard } from "@/components/admin/StatsCard";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api"; // или '@/lib/api/stats'

const COLORS = [
  "hsl(226, 70%, 55%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(199, 89%, 48%)",
  "hsl(280, 65%, 60%)",
];

const Dashboard = () => {
  const { data: overview } = useQuery({
    queryKey: ["overview"],
    queryFn: statsApi.overview,
  });
  

  const { data: salesData = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: statsApi.sales,
  });

  const { data: categoryData = [] } = useQuery({
    queryKey: ["by-category"],
    queryFn: statsApi.byCategory,
  });

  const { data: recentOrders = [] } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: statsApi.recentOrders,
  });
  console.log(salesData)
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's what's happening with your store."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Products"
          value={overview?.totalProducts}
          change="+12% from last month"
          changeType="positive"
          icon={Package}
          iconColor="bg-primary/10 text-primary"
        />
        <StatsCard
          title="Total Orders"
          value={overview?.totalOrders}
          change="+8% from last month"
          changeType="positive"
          icon={ShoppingCart}
          iconColor="bg-success/10 text-success"
        />
        <StatsCard
          title="New Users"
          value={overview?.newUsers}
          change="-3% from last month"
          changeType="negative"
          icon={Users}
          iconColor="bg-warning/10 text-warning"
        />
        <StatsCard
          title="Revenue"
          value={overview?.revenue}
          change="+15% from last month"
          changeType="positive"
          icon={DollarSign}
          iconColor="bg-info/10 text-info"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">
                Sales Overview
              </h3>
              <p className="text-sm text-muted-foreground">
                Monthly revenue and orders
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-success">
              <TrendingUp className="h-4 w-4" />
              <span>+15.3%</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient
                    id="salesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(226, 70%, 55%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(226, 70%, 55%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(220, 13%, 91%)"
                />
                <XAxis
                  dataKey="name"
                  stroke="hsl(220, 9%, 46%)"
                  fontSize={12}
                />
                <YAxis stroke="hsl(220, 9%, 46%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 91%)",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(226, 70%, 55%)"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-card-foreground">
              Sales by Category
            </h3>
            <p className="text-sm text-muted-foreground">
              Product distribution
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Chart & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Bar Chart */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-card-foreground">
              Orders Overview
            </h3>
            <p className="text-sm text-muted-foreground">Monthly order count</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(220, 13%, 91%)"
                />
                <XAxis
                  dataKey="name"
                  stroke="hsl(220, 9%, 46%)"
                  fontSize={12}
                />
                <YAxis stroke="hsl(220, 9%, 46%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 91%)",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="orders"
                  fill="hsl(142, 71%, 45%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-card-foreground">
              Recent Orders
            </h3>
            <p className="text-sm text-muted-foreground">
              Latest customer orders
            </p>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {order.customer.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{order.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{order.total}</p>
                  <p
                    className={`text-xs ${
                      order.status === "Delivered"
                        ? "text-success"
                        : order.status === "Shipped"
                        ? "text-info"
                        : order.status === "Pending"
                        ? "text-warning"
                        : "text-primary"
                    }`}
                  >
                    {order.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
