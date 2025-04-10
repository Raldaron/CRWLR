// components/Modals/ReadMoreModal.tsx
import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  Box,
} from '@chakra-ui/react';
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming you have this

interface ReadMoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string | undefined | null; // Allow undefined/null
}

const ReadMoreModal: React.FC<ReadMoreModalProps> = ({ isOpen, onClose, title, content }) => {
  // Function to format text with line breaks
  const formatText = (text: string | undefined | null): string => {
    if (!text) return 'No content available.';
    // Replace literal '\n' sequences, handle multiple occurrences
    return text.replace(/\\n/g, '\n');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg="gray.800" color="gray.100">
        <ModalHeader borderColor="gray.700">{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {/* Apply pre-wrap and allow scrolling within the modal body */}
          <Box maxHeight="70vh" overflowY="auto" pr={2}> {/* Added padding-right for scrollbar */}
             <Text whiteSpace="pre-wrap" wordBreak="break-word">
                 {formatText(content)}
             </Text>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ReadMoreModal;