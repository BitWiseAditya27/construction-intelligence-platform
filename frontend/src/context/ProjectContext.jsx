import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProjectsAndHealth = async () => {
    try {
      const [projData, healthData] = await Promise.all([
        apiClient.getProjects().catch(() => []),
        apiClient.getHealth().catch(() => null),
      ]);
      setProjects(projData);
      setSystemHealth(healthData);
      if (projData && projData.length > 0 && !activeProject) {
        setActiveProject(projData[0]);
      }
    } catch (err) {
      console.warn('Could not fetch project context data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsAndHealth();
  }, []);

  const refreshProjects = async () => {
    try {
      const data = await apiClient.getProjects();
      setProjects(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        systemHealth,
        refreshProjects,
        loading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
