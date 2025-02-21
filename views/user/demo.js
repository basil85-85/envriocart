async function placeOrder(e, userId) {
    e.preventDefault();
    let isvaild = true;

    // Get selected address
    const selectedAddress = document.querySelector('input[name="flexRadioDefault"]:checked');
    if (!selectedAddress) {
        isvaild = false;
        showErrorNotification("Please select a delivery address");
    }

    let Address = {};
    if (isvaild) {
        const addressBox = selectedAddress.closest('.delivery-address-box');
        Address = {
            id: selectedAddress.value,
            name: addressBox.querySelector('.name').innerText,
            address: addressBox.querySelector('.address p').innerText,
            pincode: addressBox.querySelector('.address span:nth-child(3)').innerText.split(":")[1].trim(),
            phone: addressBox.querySelector('.address span:nth-child(4)').innerText.split(":")[1].trim()
        };
    }

    // Get selected payment method
    const selectedPayment = document.querySelector('input[name="payment_method"]:checked');
    if (!selectedPayment) {
        isvaild = false;
        showErrorNotification("Please select a payment method");
    }

    let paymentDetails = {};
    if (isvaild) {
        paymentDetails = {
            method: selectedPayment.nextElementSibling.innerText.trim(),
            id: selectedPayment.value
        };
    }

    // Get cart items
    const cartItems = [];
    const items = document.querySelectorAll('.qty li');

    if (items.length === 0) {
        isvaild = false;
        showErrorNotification("Cart is empty");
    }

    if (isvaild) {
        items.forEach(item => {
            const price = item.querySelector('h5').innerText.split("Rs:")[1].split("x")[0].trim();
            const color = item.querySelector('p')?.innerText.trim() || "N/A";
            const size = item.querySelector('h6')?.innerText.trim() || "N/A";
            const verientId = item.querySelector("#veraent-Id")?.value || "";
            const quantity = item.querySelector('h5').innerText.split("x")[1].trim();

            cartItems.push({
                name: item.querySelector('h4').innerText,
                color: color,
                size: size,
                verientId: verientId,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                total: parseFloat(item.querySelector('.text-theme').innerText.split("Rs :")[1].trim()),
                image: item.querySelector('img').src
            });
        });
    }

    if (!isvaild) return;

    // Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => sum + item.total, 0);

    // If Razorpay is selected
    if (paymentDetails.method.includes("RAZOR")) {
        try {
            // First create order in your backend
            const orderResponse = await fetch(`/create-razorpay-order?id=${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: totalAmount,
                    address: Address,
                    cartItems: cartItems
                })
            });
            const orderData = await orderResponse.json();

            if (!orderData.success) {
                throw new Error(orderData.message);
            }

            // Initialize Razorpay payment
            const options = {
                key: 'YOUR_RAZORPAY_KEY_ID', // Replace with your actual key
                amount: orderData.amount,
                currency: "INR",
                name: "Your Store Name",
                description: "Order Payment",
                order_id: orderData.orderId,
                handler: async function (response) {
                    const verifyResponse = await fetch(`/verify-payment?id=${userId}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            address: Address,
                            cartItems: cartItems
                        })
                    });
                    const verifyData = await verifyResponse.json();

                    if (verifyData.success) {
                        showSuccessNotification("Payment successful!");
                        window.location.href = "/order-success";
                    } else {
                        showErrorNotification("Payment verification failed!");
                    }
                },
                prefill: {
                    name: Address.name,
                    contact: Address.phone
                },
                theme: {
                    color: "#3399cc"
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Error:", error);
            showErrorNotification("Payment initialization failed. Please try again.");
        }
    } else {
        // Original COD flow
        fetch(`/placeOrder?id=${userId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                address: Address,
                payment: paymentDetails,
                cartItems: cartItems
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccessNotification("Order placed successfully!");
                window.location.href = "/order-success";
            } else {
                showErrorNotification("Error placing order: " + data.message);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            showErrorNotification("Something went wrong. Please try again.");
        });
    }
}