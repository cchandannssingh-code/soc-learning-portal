
import { getNotesTree, getAllNotes } from "@/lib/notes";

export default function TestPage() {
  const tree = getNotesTree();
  const notes = getAllNotes();
  
  return (
    <div className="p-8 bg-white text-black">
      <h1 className="text-2xl font-bold mb-8">Debug Info</h1>
      
      <h2 className="text-xl font-semibold mb-4">Tree:</h2>
      <pre className="bg-gray-100 p-4 rounded mb-8 overflow-auto">
        {JSON.stringify(tree, null, 2)}
      </pre>
      
      <h2 className="text-xl font-semibold mb-4">All Notes:</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(notes.map(n => n.slug), null, 2)}
      </pre>
    </div>
  )
}
