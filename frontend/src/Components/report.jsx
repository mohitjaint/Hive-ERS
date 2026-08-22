import { Award, ChartColumn, CircleAlert, TrendingUp } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const bardata = [
  { name: "Jan", borrow: 4, return: 4 },
  { name: "Feb", borrow: 3, return: 2 },
  { name: "Mar", borrow: 2, return: 3 },
  { name: "Apr", borrow: 5, return: 4 },
  { name: "May", borrow: 6, return: 5 },
  { name: "Jun", borrow: 2, return: 2 },
];
const piedata = [
  { name: 'Excellent', value: 60, color: '#10b981' }, // Deep green
  { name: 'Good', value: 25, color: '#3b82f6' },      // Bright blue
  { name: 'Fair', value: 10, color: '#f59e0b' },      // Soft orange
  { name: 'Damaged', value: 5, color: '#ef4444' },     // Muted red
];
const ReportPage = () => {
  return (
    <div className="p-4 sm:p-5 relative max-w-screen mx-auto w-full bg-bg overflow-x-hidden">
      <div className="text-heading mb-6">
        <h1 className="text-2xl font-medium">Reports</h1>
        <p className="text-fg text-sm font-mono">Your performance analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div>
          <div className="rounded-md border border-gold flex items-center p-7 gap-4 w-full bg-card">
            <ChartColumn
              size={40}
              className="text-[#0A819A] p-2 bg-[#102838] rounded-md"
            />
            <div>
              <h1 className="text-heading text-xl font-bold">12</h1>
              <p className="text-fg">Total Borrowed</p>
            </div>
          </div>
        </div>
        {/*  */}
        <div>
          <div className="rounded-md border border-gold flex items-center p-7 gap-4 w-full bg-card">
            <TrendingUp
              size={40}
              className="text-[#10B67F] p-2 bg-[#064E3B] rounded-md"
            />
            <div>
              <h1 className="text-heading text-xl font-bold">12</h1>
              <p className="text-fg">Total Returned</p>
            </div>
          </div>
        </div>
        {/*  */}
        <div>
          <div className="rounded-md border border-gold flex items-center p-7 gap-4 w-full bg-card">
            <CircleAlert
              size={40}
              className="text-[#A75C0E] p-2 bg-[#78350F] rounded-md"
            />
            <div>
              <h1 className="text-heading text-xl font-bold">12</h1>
              <p className="text-fg">Total Borrowed</p>
            </div>
          </div>
        </div>
        {/*  */}
        <div>
          <div className="rounded-md border border-gold flex items-center p-7 gap-4 w-full bg-card">
            <Award
              size={40}
              className="text-[#336DCE] p-2 bg-[#15233C] rounded-md"
            />
            <div>
              <h1 className="text-heading text-xl font-bold">12</h1>
              <p className="text-fg">Total Borrowed</p>
            </div>
          </div>
        </div>
      </div>

      {/*  */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-heading mb-8">
        <div className="bg-card border border-gold rounded-xl p-6 transition-all duration-200  ">
          <div className="mb-4 ">
            <h3 className="text-lg font-semibold text-heading ">Punctuality</h3>
          </div>
          <div className="">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground">
                    Return Punctuality
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    85%
                  </span>
                </div>
                <div className="w-full bg-surface rounded-full h-3">
                  <div className="bg-gold h-3 rounded-full transition-all w-[85%] z-50"></div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                You return items on time 85% of the time. Great job!
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-gold rounded-xl p-6 transition-all duration-200  ">
          <div className="mb-4 ">
            <h3 className="text-lg font-semibold text-card-foreground ">
              Item Condition
            </h3>
          </div>
          <div className="">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Average Condition
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    92%
                  </span>
                </div>
                <div className="w-full bg-surface rounded-full h-3">
                  <div className="bg-gold from-success to-info h-3 rounded-full transition-all w-[92%]"></div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Items are returned in excellent condition 92% of the time.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-heading">
        <div className="bg-card border border-gold rounded-xl p-6 transition-all duration-200  ">
          <div className="mb-4 ">
            <h3 className="text-lg font-semibold text-card-foreground ">
              Borrow vs Return Trend
            </h3>
          </div>

          <div>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bardata}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  barGap={6}
                >
                  {/* Dashed background grid lines matching Figma */}
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#22252a"
                    vertical={true}
                    horizontal={true}
                  />

                  {/* X-Axis Setup */}
                  <XAxis
                    dataKey="name"
                    axisLine={{ stroke: "#474d57", strokeWidth: 1 }}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    dy={10}
                  />

                  {/* Y-Axis Setup (Steps of 2 up to 8) */}
                  <YAxis
                    domain={[0, 8]}
                    tickCount={5}
                    axisLine={{ stroke: "#474d57", strokeWidth: 1 }}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    dx={-5}
                  />

                  {/* Custom styled dark tooltip */}
                  <Tooltip
                    // content={<CustomTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />

                  {/* Cyan Borrow Bars - Rounded top corners */}
                  <Bar
                    dataKey="borrow"
                    fill="#00b4d8"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                  />

                  {/* Green Return Bars - Rounded top corners */}
                  <Bar
                    dataKey="return"
                    fill="#00e676"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bg-card border border-gold rounded-xl p-6 transition-all duration-200  ">
          <div className="mb-4 ">
            <h3 className="text-lg font-semibold text-card-foreground ">
              Return Condition Distribution
            </h3>
          </div>

          <div >
           

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-64">
              {/* Pie Chart Container */}
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {/* <Tooltip content={<CustomTooltip />} /> */}
                    <Pie
                      data={piedata}
                      cx="50%"
                      cy="50%"
                      innerRadius={0} // Set to > 0 (e.g., 50) if you want to turn this into a Donut chart
                      outerRadius={80}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {piedata.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#050505"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Figma Color Legend Block */}
              <div className="flex flex-col gap-3 min-w-40">
                
                {piedata.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-300 text-sm font-medium">
                        {item.name}
                      </span>
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: item.color }}
                    >
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
