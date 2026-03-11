import { Sidebar } from '../components/Sidebar';
import { NoteEditor } from '../components/Editor';
import { useOutletContext } from 'react-router-dom';

export function NotesPage() {
  const { sidebarOpen } = useOutletContext<{ sidebarOpen?: boolean; setSidebarOpen?: (open: boolean) => void }>();
  
  return (
    <>
      <div className={`sidebar-container ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar />
      </div>
      <NoteEditor />
    </>
  );
}