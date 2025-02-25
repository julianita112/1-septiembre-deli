import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  IconButton,
  Select,
  Option,
} from "@material-tailwind/react";
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/solid";
import axios from "../../utils/axiosConfig";
import Swal from 'sweetalert2';
import { useAuth } from "@/context/authContext";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState({
    nombre: "",
    email: "",
    password: "",
    id_rol: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [usuariosPerPage] = useState(3); // Define cuántos usuarios mostrar por página
  const [search, setSearch] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/usuarios");
      const data = response.data;
      setUsuarios(data);
      setFilteredUsuarios(data.filter(usuario => usuario.id_usuario !== currentUser.id_usuario)); // Exclude current user
    } catch (error) {
      console.error("Error fetching usuarios:", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/roles");
      const data = response.data;
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  useEffect(() => {
    const filtered = usuarios.filter(user =>
      user.nombre.toLowerCase().includes(search.toLowerCase()) &&
      user.id_usuario !== currentUser.id_usuario // Exclude current user
    );
    setFilteredUsuarios(filtered);
  }, [search, usuarios, currentUser.id_usuario]);

  const handleOpen = () => {
    setOpen(!open);
    setFormErrors({});
  };

  const handleDetailsOpen = () => setDetailsOpen(!detailsOpen);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditMode(true);
    setOpen(true);
    setFormErrors({});
  };

  const handleCreate = () => {
    setSelectedUser({
      nombre: "",
      email: "",
      password: "",
      id_rol: "",
    });
    setEditMode(false);
    setOpen(true);
    setFormErrors({});
  };

  const handleDelete = async (user) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Estás seguro de que deseas eliminar al usuario ${user.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#000000 ',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:3000/api/usuarios/${user.id_usuario}`);
        fetchUsuarios();
        Toast.fire({
          icon: 'success',
          title: '¡Eliminado! El usuario ha sido eliminado.'
        });
      } catch (error) {
        console.error("Error deleting usuario:", error);
        Toast.fire({
          icon: 'error',
          title: 'Error al eliminar usuario. Por favor, inténtalo de nuevo.'
        });
      }
    }
  };

  const handleSave = async () => {
    const isValid = validateFields(selectedUser);
    if (!isValid) {
      Toast.fire({
        icon: 'error',
        title: 'Por favor, completa todos los campos correctamente.'
      });
      return;
    }

    try {
      if (editMode) {
        await axios.put(`http://localhost:3000/api/usuarios/${selectedUser.id_usuario}`, selectedUser);
        fetchUsuarios();
        Toast.fire({
          icon: 'success',
          title: '¡Actualizado! El usuario ha sido actualizado correctamente.'
        });
      } else {
        await axios.post("http://localhost:3000/api/usuarios/registro", selectedUser);
        fetchUsuarios();
        Toast.fire({
          icon: 'success',
          title: '¡Creado! El usuario ha sido creado correctamente.'
        });
      }
      setOpen(false);
    } catch (error) {
      console.error("Error saving usuario:", error);
      Toast.fire({
        icon: 'error',
        title: 'Error al guardar usuario. Por favor, inténtalo de nuevo.'
      });
    }
  };

  const validateFields = (user) => {
    const errors = {};
    if (!user.nombre) {
      errors.nombre = 'El nombre es obligatorio.';
    } else if (user.nombre.length < 3) {
      errors.nombre = 'El nombre debe contener al menos 3 letras.';
    } else if (user.nombre.length > 30) {
      errors.nombre = 'El nombre no debe exceder los 30 caracteres.';
    } else if (/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/.test(user.nombre)) {
      errors.nombre = 'El nombre no debe incluir caracteres especiales ni números.';
    }

    if (!user.email) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else if (user.email.length < 5) {
      errors.email = 'El correo electrónico debe tener al menos 5 caracteres.';
    } else if (user.email.length > 30) {
      errors.email = 'El correo electrónico no debe exceder los 30 caracteres.';
    } else if (!/^[A-Za-z0-9._%+-]+/.test(user.email.split('@')[0])) {
      errors.email = 'La parte local del correo electrónico (antes del @) debe ser alfanumérica y puede incluir ._%+-';
    } else if (!/@/.test(user.email)) {
      errors.email = 'El correo electrónico debe contener un símbolo @.';
    } else if (!/^[A-Za-z0-9.-]+\.[A-Z]{2,}$/i.test(user.email.split('@')[1])) {
      errors.email = 'El dominio del correo electrónico (después del @) debe tener un formato válido.';
    }
    
    
    if (!user.password) {
      errors.password = 'La contraseña es obligatoria.';
    } else if (user.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres.';
    } else if (user.password.length > 15) {
      errors.password = 'La contraseña no debe exceder los 15 caracteres.';
    } else if (!/[A-Za-z]/.test(user.password)) {
      errors.password = 'La contraseña debe contener al menos una letra (a-z, A-Z).';
    } else if (!/[0-9]/.test(user.password)) {
      errors.password = 'La contraseña debe contener al menos un número (0-9).';
    } else if (!/[!@#$%^&*()_+={}\[\]:;'"<>,.?/\\|-]/.test(user.password)) {
      errors.password = 'La contraseña debe contener al menos un carácter especial: !@#$%^&*()_+={}[]:;\'"<>,.?/\\|-';
    }
    
    if (!user.id_rol) {
      errors.id_rol = 'Debe seleccionar un rol.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser({ ...selectedUser, [name]: value });
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const indexOfLastUsuario = currentPage * usuariosPerPage;
  const indexOfFirstUsuario = indexOfLastUsuario - usuariosPerPage;
  const currentUsuarios = filteredUsuarios.slice(indexOfFirstUsuario, indexOfLastUsuario);

  // Array de números de página
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredUsuarios.length / usuariosPerPage); i++) {
    pageNumbers.push(i);
  }

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const toggleActivo = async (id_usuario, activo) => {
    try {
      await axios.patch(`http://localhost:3000/api/usuarios/${id_usuario}/estado`, { activo: !activo });
      fetchUsuarios();
      Toast.fire({
        icon: 'success',
        title: `El usuario ha sido ${!activo ? 'activado' : 'desactivado'} correctamente.`,
      });
    } catch (error) {
      console.error("Error al cambiar el estado del usuario:", error);
      Toast.fire({
        icon: 'error',
        title: 'Hubo un problema al cambiar el estado del usuario.',
      });
    }
  };

  return (
    <>
      <div className="relative mt-2 h-32 w-full overflow-hidden rounded-xl bg-[url('/img/background-image.png')] bg-cover bg-center">
        <div className="absolute inset-0 h-full w-full bg-gray-900/75" />
      </div>
      <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
        <CardBody className="p-4">
          <Button onClick={handleCreate} className="btnagregar" color="green" size="sm" starticon={<PlusIcon className="h-4 w-4" />}>
            Crear Usuario
          </Button>
          <div className="mb-6">
            <Input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          <div className="mb-1">
            <Typography variant="h6" color="blue-gray" className="mb-4">
              Lista de Usuarios
            </Typography>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th scope="col" className="px-20 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsuarios.map((user) => (
                    <tr key={user.id_usuario}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {roles.find(role => role.id_rol === user.id_rol)?.nombre || "Rol no encontrado"}
                      </td>
                      
<td className="px-6 py-4 whitespace-nowrap">
  <button
    onClick={() => toggleActivo(user.id_usuario, user.activo)}
    className={`relative inline-flex items-center cursor-pointer transition-transform duration-300 ease-in-out h-6 w-12 rounded-full focus:outline-none ${
      user.activo
        ? 'bg-gradient-to-r from-green-800 to-green-600 hover:from-green-600 hover:to-green-400 shadow-lg transform scale-105'
        : 'bg-gradient-to-r from-red-800 to-red-500 hover:from-red-600 hover:to-red-400 shadow-lg transform scale-105'
    }`}
  >
    <span
      className={`transition-transform duration-300 ease-in-out ${
        user.activo ? 'translate-x-6' : 'translate-x-1'
      } inline-block w-5 h-5 transform bg-white rounded-full shadow-md`}
    />
    <span
      className={`absolute left-1 flex items-center text-xs text-white font-semibold ${
        user.activo ? 'opacity-0' : 'opacity-100'
      }`}
    >
    
    </span>
    <span
      className={`absolute right-1 flex items-center text-xs text-white font-semibold ${
        user.activo ? 'opacity-100' : 'opacity-0'
      }`}
    >    
        </span>
            </button>
                </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          <IconButton size="sm" className="btnedit" onClick={() => handleEdit(user)} disabled={!user.activo}>
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton className="btncancelarm" size="sm" onClick={() => handleDelete(user)} disabled={!user.activo}>
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton className="btnvisualizar" size="sm" onClick={() => handleViewDetails(user)} disabled={!user.activo}>
                            <EyeIcon className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-center mt-4">
              {pageNumbers.map(number => (
                <Button
                  key={number}
                  className={`pagination ${currentPage === number ? "active" : ""}`}
                  onClick={() => paginate(number)}
                >
                  {number}
                </Button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      <Dialog open={open} handler={handleOpen} className="custom-modal bg-white rounded-lg shadow-lg max-w-lg mx-auto">
  <DialogHeader className="bg-white border-b border-white  font-semibold p-4 rounded-t-lg">
    {editMode ? "Editar Usuario" : "Crear Usuario"}
  </DialogHeader>
  <DialogBody className="p-6 space-y-6">
    <div className="space-y-4">
      <div className="relative">
        <Input
          label="Nombre"
          name="nombre"
          value={selectedUser.nombre}
          onChange={handleChange}
          error={!!formErrors.nombre}
          required
          
        />
        {formErrors.nombre && <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>}
      </div>
      
      <div className="relative">
        <Input
          label="Email"
          name="email"
          value={selectedUser.email}
          onChange={handleChange}
          error={!!formErrors.email}
          required
         
        />
        {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
      </div>
      
      <div className="relative">
        <Input
          label="Contraseña"
          type="password"
          name="password"
          value={selectedUser.password}
          onChange={handleChange}
          error={!!formErrors.password}
          required
          
        />
        {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
      </div>
      
      <div className="relative">
        <Select
          label="Rol"
          name="id_rol"
          value={String(selectedUser.id_rol)}
          onChange={(value) => setSelectedUser({ ...selectedUser, id_rol: value })}
          required
          
        >
          {roles.map((role) => (
            <Option key={role.id_rol} value={String(role.id_rol)}>
              {role.nombre}
            </Option>
          ))}
        </Select>
        {formErrors.id_rol && <p className="text-red-500 text-xs mt-1">{formErrors.id_rol}</p>}
      </div>
    </div>
  </DialogBody>
  <DialogFooter className="bg-white border-t border-white p-4 rounded-b-lg flex justify-end space-x-2">
    <Button className="btncancelarm bg-gradient-to-r from-red-600 to-red-400 text-white hover:from-red-500 hover:to-red-300 shadow-md transition-all duration-300" size="sm" onClick={handleOpen}>
      Cancelar
    </Button>
    <Button className="btnagregarm bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:from-blue-500 hover:to-blue-300 shadow-md transition-all duration-300" size="sm" onClick={handleSave}>
      {editMode ? "Guardar cambios" : "Crear Usuario"}
    </Button>
  </DialogFooter>
</Dialog>

<Dialog open={detailsOpen} handler={handleDetailsOpen} className="max-w-xs w-11/12" size="xs">
<DialogHeader className="font-bold text-gray-900">
<Typography variant="h4">Detalles del Usuario</Typography>
    </DialogHeader>
    <DialogBody divider className="p-4">
    <div className="space-y-1">
      <Typography variant="subtitle2" className="font-bold text-gray-800">Nombre:</Typography>
      <Typography className="text-sm">{selectedUser.nombre}</Typography>
      <Typography variant="subtitle2" className="font-bold text-gray-800">Email:</Typography>
      <Typography className="text-sm">{selectedUser.email}</Typography>
      <Typography variant="subtitle2" className="font-bold text-gray-800">Rol:</Typography>
      <Typography className="text-sm">{roles.find(role => role.id_rol === selectedUser.id_rol)?.nombre}</Typography>
    </div>
  </DialogBody>
  <DialogFooter>
    <Button className="btncancelarm" size="sm" onClick={handleDetailsOpen}>
      Cerrar
    </Button>
  </DialogFooter>
</Dialog>

    </>
  );
}

export default Usuarios;