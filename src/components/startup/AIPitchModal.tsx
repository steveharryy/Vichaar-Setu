import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface AIPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
  businessPlan: string | null;
  mermaidDiagram: string | null;
  logoBase64: string | null;
  projectName: string;
}

const AIPitchModal: React.FC<AIPitchModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  error,
  businessPlan,
  mermaidDiagram,
  logoBase64,
  projectName
}) => {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mermaidDiagram && !isLoading && !error && mermaidRef.current) {
      mermaid.initialize({ startOnLoad: true, theme: 'default' });
      mermaid.contentLoaded();
    }
  }, [mermaidDiagram, isLoading, error, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden" aria-describedby="ai-pitch-dialog-description">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DialogTitle className="text-2xl font-display flex items-center gap-3">
            {logoBase64 && (
              <img src={logoBase64} alt={`${projectName} Logo`} className="w-10 h-10 rounded-md shadow-sm border" />
            )}
            AI Co-Pilot: {projectName}
          </DialogTitle>
          <DialogDescription id="ai-pitch-dialog-description">
            Generated Business Plan, Architecture, and Branding via LangChain & Hugging Face.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
               <Loader2 className="h-12 w-12 animate-spin text-primary" />
               <p className="text-lg font-medium text-muted-foreground">The AI Agents are analyzing your idea...</p>
               <p className="text-sm text-muted-foreground animate-pulse">This process may take up to 30 seconds as LangChain compiles the deck.</p>
             </div>
          ) : error ? (
            <div className="p-6 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center">
              <h3 className="text-lg font-bold mb-2">Microservice Error</h3>
              <p>{error}</p>
              <p className="text-sm mt-4 opacity-70">Hint: Is your Python AI Engine running on port 8000?</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Markdown Display */}
              {businessPlan && (
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <ReactMarkdown>{businessPlan}</ReactMarkdown>
                </div>
              )}
              
              {/* Mermaid Diagram */}
              {mermaidDiagram && (
                <div className="mt-12">
                   <h3 className="text-xl font-bold mb-6 font-display border-b pb-2">Technical Architecture Diagram</h3>
                   <div className="flex justify-center p-6 bg-muted/30 rounded-xl border">
                     <div className="mermaid" ref={mermaidRef}>
                        {mermaidDiagram}
                     </div>
                   </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AIPitchModal;
