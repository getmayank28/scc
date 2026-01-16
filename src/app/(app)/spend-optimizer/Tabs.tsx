import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TabItem = {
  value: string
  label: string
}

type SpendOptimizerTabsProps = {
  value: string
  onChange: (value: string) => void
  tabs: TabItem[]
}

const SpendOptimizerTabs = ({
  value,
  onChange,
  tabs,
}: SpendOptimizerTabsProps) => {
  return (
    <Tabs
      value={value}
      onValueChange={onChange}
      className="dark"
    >
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

export default SpendOptimizerTabs
