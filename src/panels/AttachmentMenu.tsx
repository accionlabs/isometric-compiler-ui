import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/DropDownMenu";
import { Attachment } from "@/components/ui/IconGroup";
import { generateFlow } from "@/services/chat";
import { useMutation } from "@tanstack/react-query";
import React from "react";
interface AttachmentMenuProps {
    dropdownControls: {
        isDropdownOpen: boolean;
        setIsDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
    };
    handleUploadBoxOpen: () => void;
}
export default function AttachmentMenu(props: AttachmentMenuProps) {
    const currentUrl = new URL(window.location.href);
    const uuid = currentUrl.searchParams.get("uuid") as string;
    const { dropdownControls, handleUploadBoxOpen } = props;
    const { isDropdownOpen, setIsDropdownOpen } = dropdownControls;
    const { mutate, isPending: isCreateDiagramPending } = useMutation({
        mutationFn: generateFlow
    });
    return (
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
                <button className="h-6 mt-1">
                    <Attachment
                        className=" cursor-pointer"
                        onClick={() => setIsDropdownOpen(true)}
                    />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className=" bg-customGray">
                <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={handleUploadBoxOpen}>
                        Attach File
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => mutate({ uuid, key: "blueprint" })}
                    >
                        Generate Blueprint
                    </DropdownMenuItem>
                    <DropdownMenuItem>Generate Diagram</DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
