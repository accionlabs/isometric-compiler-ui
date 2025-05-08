import { DiagramComponent } from "@/Types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger
} from "@/components/ui/DropDownMenu";
import { generateFlow } from "@/services/chat";
import { getDocumentByuuid } from "@/services/diagrams";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CirclePlus } from "lucide-react";
import React from "react";
import { toast } from "sonner";
interface AttachmentMenuProps {
    dropdownControls: {
        isDropdownOpen: boolean;
        setIsDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
    };
    handleLoadDiagramFromJSON: (
        loadedComponents: DiagramComponent[]
    ) => Promise<void>;
    handleLoading: (loader: boolean) => void;
    handleUploadBoxOpen: () => void;
    handleGitRepoDialoagOpen: () => void;
}
export default function AttachmentMenu(props: AttachmentMenuProps) {
    const currentUrl = new URL(window.location.href);
    const uuid = currentUrl.searchParams.get("uuid") as string;
    const {
        dropdownControls,
        handleUploadBoxOpen,
        handleLoading,
        handleLoadDiagramFromJSON,
        handleGitRepoDialoagOpen
    } = props;
    const { isDropdownOpen, setIsDropdownOpen } = dropdownControls;
    const { data, refetch } = useQuery({
        queryKey: ["document-list", uuid],
        queryFn: () => getDocumentByuuid(uuid)
    });
    const { mutate } = useMutation({
        mutationFn: generateFlow,
        onSettled: (res, error) => {
            if (res?.metadata?.result && res?.metadata?.result?.length > 0) {
                handleLoadDiagramFromJSON(res.metadata.result);
            }
            if (error?.message) {
                toast.error(error.message, {
                    duration: 3000
                });
            }
            handleLoading(false);
        }
    });
    const imageFiles =
        data?.filter((doc) => doc.metadata.fileType === "image") ?? [];
    return (
        <DropdownMenu
            open={isDropdownOpen}
            onOpenChange={(e) => {
                if (e) refetch();
                setIsDropdownOpen(e);
            }}
        >
            <DropdownMenuTrigger asChild>
                <button className="h-6 mt-1">
                    <CirclePlus className=" cursor-pointer" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className=" bg-customGray">
                <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={handleUploadBoxOpen}>
                        Attach File
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleGitRepoDialoagOpen}>
                        Attach Repo
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            handleLoading(true);
                            mutate({ uuid, key: "blueprint" });
                        }}
                    >
                        Generate Blueprint
                    </DropdownMenuItem>

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            Generate Diagram
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                {imageFiles?.length > 0 ? (
                                    imageFiles.map((doc) => (
                                        <DropdownMenuItem
                                            key={doc._id}
                                            onClick={() => {
                                                handleLoading(true);

                                                mutate({
                                                    uuid,
                                                    key: "diagram",
                                                    documentId: doc._id
                                                });
                                            }}
                                        >
                                            {doc.metadata.fileName}
                                        </DropdownMenuItem>
                                    ))
                                ) : (
                                    <DropdownMenuItem>
                                        Image not found.
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
