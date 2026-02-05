export type Intent = 
    | 'order'
    | 'add_to_cart'
    | 'remove_item'
    | 'update_quantity'
    | 'show_cart'
    | 'show_total'
    | 'show_wallet'
    | 'clear_cart'
    | 'confirm_payment'
    | 'cancel_payment'
    | 'view_bill'
    | 'order_status'
    | 'show_menu'
    | 'view_canteens'
    | 'canteen_status'
    | 'suggest'
    | 'greeting'
    | 'thanks'
    | 'goodbye'
    | 'confirm_yes'
    | 'confirm_no'
    | 'unknown'

export class IntentDetector {
    static detect(text: string): Intent {
        const lower = text.toLowerCase().trim()

        // Confirmations
        if (this.isYesConfirmation(lower)) return 'confirm_yes'
        if (this.isNoConfirmation(lower)) return 'confirm_no'

        // Greetings & Pleasantries
        if (this.isGreeting(lower)) return 'greeting'
        if (this.isThanks(lower)) return 'thanks'
        if (this.isGoodbye(lower)) return 'goodbye'

        // Cart Management
        if (this.isShowCart(lower)) return 'show_cart'
        if (this.isShowTotal(lower)) return 'show_total'
        if (this.isClearCart(lower)) return 'clear_cart'
        if (this.isRemoveItem(lower)) return 'remove_item'
        if (this.isUpdateQuantity(lower)) return 'update_quantity'

        // Payment
        if (this.isConfirmPayment(lower)) return 'confirm_payment'
        if (this.isCancelPayment(lower)) return 'cancel_payment'

        // Wallet
        if (this.isShowWallet(lower)) return 'show_wallet'

        // Orders & Bills
        if (this.isViewBill(lower)) return 'view_bill'
        if (this.isOrderStatus(lower)) return 'order_status'

        // Menu & Canteen
        if (this.isShowMenu(lower)) return 'show_menu'
        if (this.isViewCanteens(lower)) return 'view_canteens'
        if (this.isCanteenStatus(lower)) return 'canteen_status'
        if (this.isSuggest(lower)) return 'suggest'

        // Order/Add
        if (this.isAddToCart(lower)) return 'add_to_cart'
        if (this.isOrder(lower)) return 'order'

        return 'unknown'
    }

    private static isYesConfirmation(text: string): boolean {
        return /^(yes|yeah|yep|sure|ok|okay|proceed|confirm|continue|go ahead|do it)$/i.test(text) ||
               text.includes('yes,') || text.includes('yes ')
    }

    private static isNoConfirmation(text: string): boolean {
        return /^(no|nope|nah|cancel|stop|don't|dont)$/i.test(text)
    }

    private static isGreeting(text: string): boolean {
        return /^(hi|hello|hey|good morning|good afternoon|good evening|greetings)$/i.test(text)
    }

    private static isThanks(text: string): boolean {
        return /^(thanks|thank you|thx|ty|appreciate it)$/i.test(text)
    }

    private static isGoodbye(text: string): boolean {
        return /^(bye|goodbye|see you|later|cya)$/i.test(text)
    }

    private static isShowCart(text: string): boolean {
        return (text.includes('what') || text.includes('show') || text.includes('view')) &&
               (text.includes('cart') || text.includes('order') && text.includes('current'))
    }

    private static isShowTotal(text: string): boolean {
        return (text.includes('how much') || text.includes('total') || text.includes('price') || text.includes('cost')) &&
               (text.includes('pay') || text.includes('cart') || text.includes('order') || text.includes('?'))
    }

    private static isClearCart(text: string): boolean {
        return (text.includes('clear') || text.includes('empty') || text.includes('reset')) &&
               text.includes('cart')
    }

    private static isRemoveItem(text: string): boolean {
        return (text.includes('remove') || text.includes('delete') || text.includes('take out')) &&
               !text.includes('cart')
    }

    private static isUpdateQuantity(text: string): boolean {
        return (text.includes('change') || text.includes('update') || text.includes('modify') ||
                text.includes('reduce') || text.includes('increase')) &&
               (text.includes('quantity') || text.includes('to '))
    }

    private static isConfirmPayment(text: string): boolean {
        return (text.includes('proceed') || text.includes('pay') || text.includes('confirm')) &&
               (text.includes('payment') || text.includes('order') || text.includes('wallet'))
    }

    private static isCancelPayment(text: string): boolean {
        return text.includes('cancel') && text.includes('payment')
    }

    private static isShowWallet(text: string): boolean {
        return (text.includes('wallet') || text.includes('balance') || text.includes('money')) &&
               (text.includes('show') || text.includes('what') || text.includes('how much') || text.includes('my'))
    }

    private static isViewBill(text: string): boolean {
        return (text.includes('bill') || text.includes('receipt') || text.includes('invoice')) &&
               (text.includes('show') || text.includes('view') || text.includes('my'))
    }

    private static isOrderStatus(text: string): boolean {
        return (text.includes('order') || text.includes('status')) &&
               (text.includes('status') || text.includes('accepted') || text.includes('ready') ||
                text.includes('did') && text.includes('go through'))
    }

    private static isViewCanteens(text: string): boolean {
        // Only match if explicitly asking for canteens list without menu context
        return (text.includes('view') || text.includes('show') || text.includes('list') || text.includes('see')) &&
               (text.includes('canteen') || text.includes('cafeteria')) &&
               !text.includes('menu') &&
               !text.includes('available') &&
               !text.includes('items') &&
               !text.includes('from')
    }

    private static isCanteenStatus(text: string): boolean {
        return (text.includes('canteen') || text.includes('open') || text.includes('closed')) &&
               (text.includes('open') || text.includes('available') || text.includes('which'))
    }

    private static isSuggest(text: string): boolean {
        return text.includes('suggest') || text.includes('recommend') ||
               (text.includes('what') && (text.includes('popular') || text.includes('good') || text.includes('quick')))
    }

    private static isShowMenu(text: string): boolean {
        return ((text.includes('menu') || text.includes('available') || text.includes('items')) &&
               (text.includes('show') || text.includes('what') || text.includes('list'))) ||
               (text.includes('from') && (text.includes('show') || text.includes('menu')))
    }

    private static isAddToCart(text: string): boolean {
        return text.includes('add') && !text.includes('money') && !text.includes('wallet')
    }

    private static isOrder(text: string): boolean {
        return text.includes('order') || text.includes('want') || text.includes('get') ||
               text.includes('buy') || text.includes('need') || text.includes('give me')
    }
}
