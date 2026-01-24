export const auth ={
    get token() {return sessionStorage.getItem("token");},
    set token(v: string | null) {v? sessionStorage.setItem("token", v) : sessionStorage.removeItem("token");}
};