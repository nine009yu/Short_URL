import React, { useRef, useState } from 'react'

const Form = () => {
    const form = useRef()
    const [url, SetUrl] = useState('')
    
    const handleUrl=(e)=>{
        SetUrl(e.target.value)
      }

    const onSubmitForm=(ev)=>{
        ev.preventDefault()

        const formData = new FormData(form.current)
        let params = new URLSearchParams(formData)
        let URL = 'http://localhost:8000/urls?' + params
        console.log(URL)
    fetch(URL)
      .then((res) => res.json())
      .then(data => {
        alert(data)
        
      })
      .catch((err) => console.log(err))
    }
  return (
    <form ref={form} onSubmit={onSubmitForm}>
        <div className='text-center mt-[50px] text-xl '>
            <h1>URL: <input type="text" className='border border-black mb-3' name="url" value={url}  onChange={handleUrl} required/></h1>
            <button className='bg-blue-700 border border-black rounded-lg text-white text-center w-[100px]'>convert</button>
        </div>
    </form>
  )
}

export default Form
