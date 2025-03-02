"use client";

import { useState } from "react";
import DeployConfirmationModal from "@/components/DeployConfirmationModal";
import { mockDeployLab } from "@/api/mockApi";

export default function CreateLabPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState("");
  
  // Sample lab ID for demonstration
  const sampleLabId = "sample-lab-123";

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    
    try {
      // Call the mock API to simulate deployment
      const response = await mockDeployLab(sampleLabId);
      
      if (response.success && response.data) {
        setDeploymentUrl(response.data.deploymentUrl);
        alert(`Lab successfully deployed at: ${response.data.deploymentUrl}`);
      } else {
        alert("Failed to deploy lab: " + (response.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Deployment error:", error);
      alert("An error occurred during deployment");
    } finally {
      setIsDeploying(false);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Create Lab</h1>
      
      {/* Lab form would go here */}
      <div className="mb-8 p-6 border rounded-md">
        <p className="mb-4">Your lab content would be here...</p>
      </div>
      
      <div className="flex justify-end">
        <button 
          onClick={handleOpenModal}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          Deploy Lab
        </button>
      </div>
      
      {deploymentUrl && (
        <div className="mt-8 p-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-md">
          <p>Lab deployed at: <a href={deploymentUrl} target="_blank" rel="noopener noreferrer" className="underline">{deploymentUrl}</a></p>
        </div>
      )}
      
      {/* Deploy Confirmation Modal */}
      <DeployConfirmationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onDeploy={handleDeploy}
        isDeploying={isDeploying}
      />
    </div>
  );
}
