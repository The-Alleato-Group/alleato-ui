import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from "@alleato/ui/components/unified-modal";
import { Button } from "@alleato/ui/components/button";

const meta = {
  title: "Components/Unified modal",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="outline">Open unified modal</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Inspection details</ModalTitle>
          <ModalDescription>
            Review the current inspection assignment.
          </ModalDescription>
        </ModalHeader>
        <p className="px-4 py-3 text-sm">Assigned to Jordan Smith.</p>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="outline">Done</Button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ),
};
