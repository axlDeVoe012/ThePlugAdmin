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
        <Route path="/newarticle" element={<NewArticle/>} />
        <Route path="/edit/:id" element={<EditArticle/>} />
        <Route path="/users" element={<Protected><UsersList/></Protected>} />
        <Route path="/newuser" element={<NewUser/>} />
        <Route path ="/clientlist" element = {<ClientList/>}/>
        <Route path="/edit-user/:id" element={<EditUser />} />
      </Routes>
    </>
  )
}

export default App;
