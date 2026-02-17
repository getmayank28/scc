import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TabItem = {
  value: string
  label: string
}

type TabsProps = {
  value: string
  onChange: (value: string) => void
  tabs: TabItem[]
}

const TabBar = ({
  value,
  onChange,
  tabs,
}: TabsProps) => {
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

export default TabBar
