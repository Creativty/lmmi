package main

import (
	"io"
	"fmt"
	"net/http"
	"encoding/json"
)

var users = []User{}
var user_reserves = []UserReserve{}

type UserReserve struct {
	ItemId	  int `json:"item_id"`
	Quantity  int `json:"quantity"`
}

type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Reserves []int  `json:"reserves,omitempty"`
}

func handler_users(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case "GET": 
		users_json, err := json.Marshal(users)
		if err != nil {
			http.Error(writer, "failure: could not json stringify the users list.", 500)
			return
		}
		fmt.Fprintf(writer, `{ "users": %s }`, users_json)
	case "POST":
		body_reader := request.Body
		body, err := io.ReadAll(body_reader)
		if err != nil {
			http.Error(writer, "failure: could not read request body.", 500)
			return
		}

		var user User
		if err = json.Unmarshal(body, &user); err != nil {
			http.Error(writer, "failure: could not json parse request body.", 400)
			return
		}
		users = append(users, user)
		fmt.Println(user, body)
		fmt.Fprint(writer, `{ "ok": true }`)
	}
}

func main() {
	http.HandleFunc("/users/", handler_users)
	fmt.Println("Starting to listen on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		panic(err)
	}
}
