// components/ui/TruncatedTextWithModal.tsx
import React from 'react';
import {
  Text,
  Button,
  useDisclosure,
  Box,
} from '@chakra-ui/react';
import ReadMoreModal from '../Modals/ReadMoreModal'; // Adjust path if needed

interface TruncatedTextWithModalProps {
  text: string | undefined | null;
  charLimit?: number;
  modalTitle: string;
  label?: string; // Optional label for the section
}

const TruncatedTextWithModal: React.FC<TruncatedTextWithModalProps> = ({
  text,
  charLimit = 150, // Default character limit
  modalTitle,
  label
}) => {
  // *** FIX: Rename state variables from useDisclosure ***
  const { isOpen: isInternalModalOpen, onOpen: openInternalModal, onClose: closeInternalModal } = useDisclosure();

  if (!text || text.trim() === '') {
    return label ? <Box><Text fontWeight="semibold" mb={1}>{label}</Text><Text fontStyle="italic" color="gray.500">N/A</Text></Box> : null;
  }

  // Function to format text with line breaks for display
  const formatText = (inputText: string): string => {
    // Replace literal '\n' sequences, handle multiple occurrences
    return inputText.replace(/\\n/g, '\n');
  };

  const requiresTruncation = text.length > charLimit;
  const displayText = requiresTruncation
    ? `${formatText(text).substring(0, charLimit)}...`
    : formatText(text);

  return (
    <Box width="100%">
       {label && <Text fontWeight="semibold" mb={1}>{label}</Text>}
       {/* Apply whiteSpace pre-wrap here for correct rendering */}
      <Text whiteSpace="pre-wrap" wordBreak="break-word">
        {displayText}
        {requiresTruncation && (
          <>
            {' '}
            <Button
              variant="link"
              colorScheme="blue"
              size="sm"
              onClick={openInternalModal} // Use renamed open function
              ml={1}
            >
              Read More
            </Button>
            {/* Pass the renamed state variables to ReadMoreModal */}
            <ReadMoreModal
              isOpen={isInternalModalOpen} // Pass renamed isOpen state
              onClose={closeInternalModal} // Pass renamed onClose function
              title={modalTitle}
              content={text} // Pass the original, unformatted text
            />
          </>
        )}
      </Text>
    </Box>
  );
};

export default TruncatedTextWithModal;