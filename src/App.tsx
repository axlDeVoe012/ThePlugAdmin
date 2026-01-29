import Login from "./pages/Login";
import ArticleList from "./pages/ArticlesList";
import NewArticle from "./pages/NewArticle";
import EditArticle from "./pages/EditArticle";
import UsersList from "./pages/UsersList";
import NewUser from "./pages/NewUser";
import EditUser from "./pages/EditUser";
import { Route, Routes } from 'react-router-dom';
import Protected from "./components/Protected";
import ClientList from "./pages/ClientList";



function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/articlelist" element={<Protected><ArticleList/></Protected>} />
        <Route path="/newarticle" element={<Protected><NewArticle/></Protected>} />
        <Route path="/edit/:id" element={<Protected><EditArticle/></Protected>} />
        <Route path="/users" element={<Protected><UsersList/></Protected>} />
        <Route path="/newuser" element={<Protected><NewUser/></Protected>} />
        <Route path ="/clientlist" element = {<Protected><ClientList/></Protected>}/>
        <Route path="/edit-user/:id" element={<Protected><EditUser/> </Protected>} />
      </Routes>
    </>
  )
}

export default App;
