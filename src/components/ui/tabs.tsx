// components/ui/tabs.tsx
import {
    Tabs as ChakraTabs,
    TabList as ChakraTabList,
    Tab as ChakraTab,
    TabPanels as ChakraTabPanels,
    TabPanel as ChakraTabPanel,
    TabsProps as ChakraTabsProps,
    TabListProps as ChakraTabListProps,
    TabProps,
    forwardRef,
  } from '@chakra-ui/react';
  import { Dispatch, ReactNode, SetStateAction } from 'react';
  
  interface CustomTabsProps extends ChakraTabsProps {
    children: ReactNode;
    value?: string;
    onValueChange?: Dispatch<SetStateAction<string>>;
    index?: number;
    onChange?: (index: number) => void;
  }
  
  export const Tabs = ({ children, value, onValueChange, index, onChange, ...props }: CustomTabsProps) => {
    const handleChange = (newIndex: number) => {
      if (onChange) {
        onChange(newIndex);
      }
      if (onValueChange && Array.isArray(children)) {
        const tabChild = children.find((child: any) => 
          child.type === TabsList && child.props.children[newIndex]
        );
        if (tabChild) {
          const newValue = tabChild.props.children[newIndex].props.value;
          onValueChange(newValue);
        }
      }
    };
  
    return (
      <ChakraTabs
        index={index}
        onChange={handleChange}
        variant="line"
        colorScheme="blue"
        {...props}
      >
        {children}
      </ChakraTabs>
    );
  };
  
  interface TabsListProps extends ChakraTabListProps {
    children: ReactNode;
  }
  
  export const TabsList = ({ children, ...props }: TabsListProps) => {
    return (
      <ChakraTabList
        borderBottom="1px"
        borderColor="gray.200"
        mb="1em"
        {...props}
      >
        {children}
      </ChakraTabList>
    );
  };
  
  interface TabsTriggerProps extends TabProps {
    value: string;
  }
  
  export const TabsTrigger = forwardRef<TabsTriggerProps, 'button'>(
    ({ value, children, ...props }, ref) => {
      return (
        <ChakraTab
          ref={ref}
          _selected={{
            color: 'blue.500',
            borderColor: 'currentColor',
          }}
          {...props}
        >
          {children}
        </ChakraTab>
      );
    }
  );
  
  interface TabsContentProps {
    children: ReactNode;
    value: string;
  }
  
  export const TabsContent = ({ children, value, ...props }: TabsContentProps) => {
    return (
      <ChakraTabPanel {...props}>
        {children}
      </ChakraTabPanel>
    );
  };