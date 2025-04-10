// src/app/dm/layout.tsx
'use client';

import React from 'react';
import { Box, Container, Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react';
import Link from 'next/link'; // Use Next.js Link for navigation
import { ChevronRightIcon } from '@chakra-ui/icons'; // Or use lucide-react ChevronRight

export default function DMLayout({ children }: { children: React.ReactNode }) {
    return (
        // Apply consistent background and padding for all DM pages
        <Box bg="gray.900" minH="100vh" color="gray.100" p={{ base: 2, md: 4 }}>
            <Container maxW="container.xl"> {/* Optional: Constrain width */}
                {/* Simple Breadcrumb for Navigation */}
                <Breadcrumb separator={<ChevronRightIcon color='gray.500' />} spacing='8px' mb={4} fontSize="sm">
                     <BreadcrumbItem>
                         <BreadcrumbLink as={Link} href="/character-manager" _hover={{color: 'brand.300'}}>
                            Character Manager
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem isCurrentPage>
                        <BreadcrumbLink href="/dm" color="brand.300" fontWeight="medium">
                            DM Dashboard
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                     {/* Add more breadcrumbs if you have nested DM pages */}
                 </Breadcrumb>

                {/* Render the specific page content (page.tsx) */}
                {children}
            </Container>
        </Box>
    );
}