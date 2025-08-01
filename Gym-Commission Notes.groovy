function checkoutCart(userId):

    // Step 1: Fetch user's cart
    cart = getCartByUserId(userId)

    // Step 2: Loop through all products in the cart
    for each item in cart.products:
        product = item.product
        quantity = item.quantity

        // Step 3: Calculate profit
        profitPerUnit = product.SellingPrice - product.CostPrice
        totalProfit = profitPerUnit × quantity

        // Step 4: Calculate 5% commission for gym
        commission = totalProfit × 0.05

        // Step 5: Add commission to gym's account (if gym exists)
        if product has gymId:
            gym = findGymById(product.gymId)
            gym.commissionEarned += commission
            save gym

        // Step 6: Update product stats
        product.Sold += quantity
        product.Stock -= quantity
        save product

    // Step 7: Empty user's cart after successful checkout
    deleteCart(cart)

    return "Checkout complete, gym commissions updated"
